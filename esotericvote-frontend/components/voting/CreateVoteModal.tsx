"use client";

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useVotingContext } from '../providers/VotingProvider';

interface CreateVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoteCreated?: () => void;
}

export function CreateVoteModal({ isOpen, onClose, onVoteCreated }: CreateVoteModalProps) {
  const { createVote, isLoading } = useVotingContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    duration: 24, // hours
    isAnonymous: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.options.filter(opt => opt.trim()).length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const startTime = Math.floor(Date.now() / 1000); // Start immediately
      const endTime = startTime + (formData.duration * 3600); // Convert hours to seconds

      const validOptions = formData.options.filter(opt => opt.trim());

      await createVote(
        formData.title.trim(),
        formData.description.trim(),
        validOptions,
        startTime,
        endTime,
        formData.isAnonymous
      );

      // Reset form
      setFormData({
        title: '',
        description: '',
        options: ['', ''],
        duration: 24,
        isAnonymous: false,
      });
      setErrors({});

      onVoteCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create vote:', error);
    }
  };

  const addOption = () => {
    if (formData.options.length < 5) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Vote">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Vote title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          error={errors.title}
        />

        <textarea
          placeholder="Vote description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}

        <div>
          <label className="text-sm font-medium">Options</label>
          <div className="space-y-2 mt-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1"
                />
                {formData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          {formData.options.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="mt-2"
            >
              Add Option
            </Button>
          )}
          {errors.options && (
            <p className="text-sm text-destructive mt-1">{errors.options}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Duration (hours)</label>
          <Input
            type="number"
            min="1"
            max="168"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 24 }))}
            className="mt-1"
            error={errors.duration}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="anonymous" className="text-sm">
            Make votes anonymous
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} isLoading={isLoading}>
            {isLoading ? 'Creating...' : 'Create Vote'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
