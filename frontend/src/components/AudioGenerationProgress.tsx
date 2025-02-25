import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressUpdate } from '../types/audio';

interface AudioGenerationProgressProps {
  updates: ProgressUpdate[];
  isGenerating: boolean;
}

const AudioGenerationProgress: React.FC<AudioGenerationProgressProps> = ({
  updates,
  isGenerating
}) => {
  const latestUpdate = updates[updates.length - 1];
  const completedSegments = updates.filter(
    update => update.type === 'segment_complete'
  );
  const hasError = updates.some(update => update.type === 'error');
  const isComplete = updates.some(update => update.type === 'complete');

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="card-title text-xl flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </span>
            Audio Generation
            {isGenerating && (
              <span className="loading loading-spinner loading-sm text-primary" />
            )}
          </h2>
          {latestUpdate && (
            <div className="text-sm font-medium text-base-content/60">
              {latestUpdate.progress.current} / {latestUpdate.progress.total} segments
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {latestUpdate && (
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-base-content/60">
                {latestUpdate.stage}
              </span>
              <span className="text-sm font-medium text-base-content/60">
                {Math.round(latestUpdate.progress.percentage)}%
              </span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${latestUpdate.progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Current Operation */}
        {isGenerating && latestUpdate && (
          <AnimatePresence mode="wait">
            <motion.div
              key={latestUpdate.speaker}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 p-4 bg-base-200/50 rounded-lg backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="loading loading-spinner loading-sm text-primary" />
              </div>
              <div>
                <div className="font-medium">{latestUpdate.message}</div>
                <div className="text-sm text-base-content/60">
                  {latestUpdate.speaker}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Completed Segments */}
        {completedSegments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-base-content/60">
              Completed Segments
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {completedSegments.map((segment, index) => (
                  <motion.div
                    key={segment.segment_path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-base-200/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-success"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{segment.speaker}</div>
                        <div className="text-sm text-base-content/60">
                          Duration: {segment.duration?.toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-error/10 border border-error/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-error">Generation Failed</div>
                <div className="text-sm text-error/60">
                  {updates.find(u => u.type === 'error')?.error}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion State */}
        {isComplete && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-success/10 border border-success/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-success">Generation Complete</div>
                <div className="text-sm text-success/60">
                  Successfully generated {completedSegments.length} audio segments
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AudioGenerationProgress;
