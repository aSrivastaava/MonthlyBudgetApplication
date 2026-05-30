const express = require('express');
const House = require('../models/House');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new house
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Please provide a house name' });
    }
    
    // Generate unique house key
    const houseKey = await House.generateHouseKey();
    
    // Create house
    const house = new House({
      name,
      houseKey,
      owner: req.userId,
      members: [{
        userId: req.userId,
        role: 'owner'
      }]
    });
    
    await house.save();
    
    // Add house to user's houses
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        houses: {
          houseId: house._id,
          role: 'owner'
        }
      }
    });
    
    res.status(201).json({
      message: 'House created successfully',
      house: {
        id: house._id,
        name: house.name,
        houseKey: house.houseKey,
        role: 'owner'
      }
    });
  } catch (error) {
    console.error('Create house error:', error);
    res.status(500).json({ message: 'Server error creating house' });
  }
});

// Join a house using house key
router.post('/join', auth, async (req, res) => {
  try {
    const { houseKey } = req.body;
    
    if (!houseKey) {
      return res.status(400).json({ message: 'Please provide a house key' });
    }
    
    // Find house by key
    const house = await House.findOne({ houseKey: houseKey.toUpperCase() });
    if (!house) {
      return res.status(404).json({ message: 'Invalid house key' });
    }
    
    // Check if user is already a member
    const isMember = house.members.some(member => member.userId.toString() === req.userId.toString());
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this house' });
    }
    
    // Add user to house
    house.members.push({
      userId: req.userId,
      role: 'member'
    });
    await house.save();
    
    // Add house to user's houses
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        houses: {
          houseId: house._id,
          role: 'member'
        }
      }
    });
    
    res.json({
      message: 'Joined house successfully',
      house: {
        id: house._id,
        name: house.name,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('Join house error:', error);
    res.status(500).json({ message: 'Server error joining house' });
  }
});

// Get user's houses
router.get('/my-houses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('houses.houseId');
    
    const houses = user.houses.map(house => ({
      id: house.houseId._id,
      name: house.houseId.name,
      houseKey: house.houseId.houseKey,
      role: house.role,
      owner: house.houseId.owner
    }));
    
    res.json({ houses });
  } catch (error) {
    console.error('Get houses error:', error);
    res.status(500).json({ message: 'Server error fetching houses' });
  }
});

// Get house details
router.get('/:houseId', auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId)
      .populate('owner', 'username email')
      .populate('members.userId', 'username email');
    
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Check if user is a member
    const userMembership = house.members.find(member => member.userId._id.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    res.json({
      house: {
        id: house._id,
        name: house.name,
        houseKey: house.houseKey,
        owner: house.owner,
        members: house.members,
        userRole: userMembership.role
      }
    });
  } catch (error) {
    console.error('Get house error:', error);
    res.status(500).json({ message: 'Server error fetching house' });
  }
});

// Rename house
router.put('/:houseId/rename', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Please provide a new name' });
    }
    
    const house = await House.findById(req.params.houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Check if user is a member
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership) {
      return res.status(403).json({ message: 'You are not a member of this house' });
    }
    
    // Check if user is owner or admin
    if (userMembership.role !== 'owner' && userMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only owners and admins can rename the house' });
    }
    
    // Update house name
    house.name = name;
    await house.save();
    
    res.json({
      message: 'House renamed successfully',
      house: {
        id: house._id,
        name: house.name
      }
    });
  } catch (error) {
    console.error('Rename house error:', error);
    res.status(500).json({ message: 'Server error renaming house' });
  }
});

// Assign role to member (admin only)
router.put('/:houseId/assign-role', auth, async (req, res) => {
  try {
    const { memberId, role } = req.body;
    
    if (!memberId || !role) {
      return res.status(400).json({ message: 'Please provide member ID and role' });
    }
    
    const validRoles = ['admin', 'financier', 'rent payer', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const house = await House.findById(req.params.houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Check if user is owner or admin
    const userMembership = house.members.find(member => member.userId.toString() === req.userId.toString());
    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return res.status(403).json({ message: 'Only owners and admins can assign roles' });
    }
    
    // Find member to update
    const memberToUpdate = house.members.find(member => member.userId.toString() === memberId);
    if (!memberToUpdate) {
      return res.status(404).json({ message: 'Member not found in this house' });
    }
    
    // Cannot change owner role
    if (memberToUpdate.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }
    
    // Update member role in house
    memberToUpdate.role = role;
    await house.save();
    
    // Update role in user's houses array
    await User.updateOne(
      { _id: memberId, 'houses.houseId': house._id },
      { $set: { 'houses.$.role': role } }
    );
    
    res.json({
      message: 'Role assigned successfully',
      member: {
        userId: memberId,
        role: role
      }
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Server error assigning role' });
  }
});

// Leave a house (non-owners only)
router.post('/:houseId/leave', auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const userMembership = house.members.find(m => m.userId.toString() === req.userId.toString());
    if (!userMembership) return res.status(400).json({ message: 'Not a member' });
    if (userMembership.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot leave. Transfer ownership or delete the house.' });
    }

    house.members = house.members.filter(m => m.userId.toString() !== req.userId.toString());
    await house.save();

    await User.updateOne({ _id: req.userId }, { $pull: { houses: { houseId: house._id } } });

    res.json({ message: 'Left house successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a house (owner only)
router.delete('/:houseId', auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    if (house.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this house' });
    }

    // Remove house from all members
    const memberIds = house.members.map(m => m.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { houses: { houseId: house._id } } }
    );

    await House.deleteOne({ _id: house._id });
    res.json({ message: 'House deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a member (owner/admin only)
router.delete('/:houseId/members/:memberId', auth, async (req, res) => {
  try {
    const { houseId, memberId } = req.params;
    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const userMembership = house.members.find(m => m.userId.toString() === req.userId.toString());
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const targetMember = house.members.find(m => m.userId.toString() === memberId);
    if (!targetMember) return res.status(404).json({ message: 'Member not found' });
    if (targetMember.role === 'owner') return res.status(400).json({ message: 'Cannot remove owner' });

    house.members = house.members.filter(m => m.userId.toString() !== memberId);
    await house.save();
    await User.updateOne({ _id: memberId }, { $pull: { houses: { houseId: house._id } } });

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
