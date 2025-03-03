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
    <div className="card glass shadow-xl border border-base-content/10">
      <div className="card-body p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="card-title text-xl flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
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
              <span className="loading loading-spinner loading-sm text-primary ml-2" />
            )}
          </h2>
          {latestUpdate && (
            <div className="badge badge-primary badge-outline font-medium">
              {latestUpdate.progress.current} / {latestUpdate.progress.total} segments
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {latestUpdate && (
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-base-content/70">
                {latestUpdate.stage}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(latestUpdate.progress.percentage)}%
              </span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-primary/80 to-primary"
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
              className="flex items-center gap-4 p-5 bg-base-200/50 rounded-xl backdrop-blur-sm shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-md">
                <span className="loading loading-spinner loading-sm text-primary" />
              </div>
              <div>
                <div className="font-medium text-base-content">{latestUpdate.message}</div>
                <div className="text-sm text-base-content/70 mt-1">
                  Speaker: <span className="font-medium text-primary">{latestUpdate.speaker}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Completed Segments */}
        {completedSegments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-base-content/80 flex items-center gap-2">
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
              Completed Segments
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
              <AnimatePresence>
                {completedSegments.map((segment, index) => (
                  <motion.div
                    key={segment.segment_path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-base-200/30 hover:bg-base-200/50 rounded-lg border border-base-content/5 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shadow-sm">
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
                        <div className="text-xs text-base-content/60 mt-1">
                          Duration: <span className="font-medium">{segment.duration?.toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-circle btn-xs btn-ghost text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                      </svg>
                    </button>
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
            className="p-5 bg-error/10 border border-error/20 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-error"
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
                <div className="font-medium text-error text-lg">Generation Failed</div>
                <div className="text-sm text-error/80 mt-1">
                  {updates.find(u => u.type === 'error')?.error || 'An unknown error occurred'}
                </div>
                <button className="btn btn-sm btn-outline btn-error mt-3">
                  Retry Generation
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion State */}
        {isComplete && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-success/10 border border-success/20 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success"
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
                <div className="font-medium text-success text-lg">Generation Complete</div>
                <div className="text-sm text-success/80 mt-1">
                  Successfully generated {completedSegments.length} audio segments
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-sm btn-outline btn-success">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Download All
                  </button>
                  <button className="btn btn-sm btn-ghost">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                    Play All
                  </button>
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
