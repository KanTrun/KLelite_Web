import { Response, NextFunction } from 'express';
import { asyncHandler, successResponse } from '../utils';
import { AuthRequest } from '../types';
import { chatbotService } from '../services/chatbotService';

// @desc    Send message to chatbot
// @route   POST /api/chat/message
// @access  Public (Optional Auth)
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { message, conversationHistory } = req.body;
  const userId = req.user?._id?.toString();

  const response = await chatbotService.handleMessage(message, userId, conversationHistory);

  successResponse(res, {
    message: response,
    timestamp: new Date()
  });
});
