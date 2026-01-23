import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Socket.IO Email Event Handler
 * Handles real-time email communication
 */
export const emailSocketHandler = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.email}`);
    socket.join(`email:${socket.userId}`);

    // Join user's personal room for targeted updates
    socket.join(`user:${socket.userId}`);

    // Handle new email
    socket.on('send_email', async (data) => {
      try {
        // Email sending logic would be here
        io.to(`user:${socket.userId}`).emit('email_sent', {
          success: true,
          email: data
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle mark as read
    socket.on('mark_read', (data) => {
      try {
        io.to(`user:${socket.userId}`).emit('email_updated', data);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', {
        userId: socket.userId,
        ...data
      });
    });

    // Handle starred/flagged
    socket.on('flagged', (data) => {
      io.to(`user:${socket.userId}`).emit('email_updated', data);
    });

    // Handle moved to folder
    socket.on('moved', (data) => {
      io.to(`user:${socket.userId}`).emit('email_updated', data);
    });

    // Handle deleted
    socket.on('deleted', (data) => {
      io.to(`user:${socket.userId}`).emit('email_deleted', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

// Helper functions for real-time email notifications
export const sendNewEmail = (userId, email) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('new_email', email);
  }
};

export const sendEmailReadStatus = (userId, data) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('email_read_status', data);
  }
};

export const sendEmailSent = (userId, email) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('email_sent', email);
  }
};

export const sendEmailFlagged = (userId, data) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('email_flagged', data);
  }
};

export const sendEmailMoved = (userId, data) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('email_moved', data);
  }
};

export const sendEmailDeleted = (userId, data) => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('email_deleted', data);
  }
};

export default emailSocketHandler;
