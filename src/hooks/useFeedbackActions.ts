import { useState } from "react";
import axios from "axios";

interface FeedbackPayload {
  content: string;
  rating: number;
}

export function useFeedbackActions() {
  const [isLoading, setIsLoading] = useState(false);

  const createFeedback = async (projectId: string | number, payload: FeedbackPayload) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`/api/project/feedbacks/create/${projectId}`, payload);
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedback = async (feedbackId: number, payload: FeedbackPayload) => {
    setIsLoading(true);
    try {
      const res = await axios.put(`/api/project/feedbacks/update/${feedbackId}`, payload);
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId: number) => {
    setIsLoading(true);
    try {
      const res = await axios.delete(`/api/project/feedbacks/delete/${feedbackId}`);
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const reactToFeedback = async (feedbackId: number, reactionType: "LIKE" | "LOVE" | "LAUGH" | "WOW" | "SAD" | "ANGRY") => {
    setIsLoading(true);
    try {
      const res = await axios.post(`/api/project/feedback-reaction/create/${feedbackId}`, { reactionType });
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const removeReaction = async (feedbackId: number) => {
    setIsLoading(true);
    try {
      const res = await axios.delete(`/api/project/feedback-reaction/remove/${feedbackId}`);
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    reactToFeedback,
    removeReaction,
  };
}
