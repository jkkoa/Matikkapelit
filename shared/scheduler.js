/* Matikkapelit — Within-Session Expanding-Retrieval Scheduler (Zero PII)
 *
 * When a child misses an item (or uses a peek/hint), it is quietly re-queued
 * at an expanding lag (2 turns later, then 4-5 turns later) rather than
 * immediately back-to-back. Every new round starts clean — no stale cross-child
 * state on shared classroom iPads.
 */
window.MatikkaScheduler = (() => {
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /**
   * Create a round queue with expanding retrieval for missed/assisted keys.
   *
   * @param {Object} opts
   * @param {Array<string|number>} opts.pool - Candidate item keys (e.g. [1..10])
   * @param {number} [opts.roundLength=10] - Base number of items in the round
   * @param {number} [opts.maxExtraTurns=4] - Safety cap on added review turns
   * @param {number} [opts.maxRequeuesPerKey=2] - Max expanding re-queues per key
   */
  function createSession({ pool, roundLength = 10, maxExtraTurns = 4, maxRequeuesPerKey = 2 }) {
    const uniquePool = Array.from(new Set(pool));
    const queue = [];

    // Fill initial queue evenly from shuffled passes without back-to-back duplicates
    while (queue.length < roundLength) {
      let pass = shuffle(uniquePool);
      if (queue.length > 0 && pass.length > 1 && pass[0] === queue[queue.length - 1]) {
        [pass[0], pass[1]] = [pass[1], pass[0]];
      }
      for (const key of pass) {
        if (queue.length < roundLength) {
          queue.push({ key, isReview: false, reviewStage: 0 });
        }
      }
    }

    let cursor = 0;
    let extraAdded = 0;
    let cleanCount = 0;
    const requeueCounts = new Map();

    function current() {
      return cursor < queue.length ? queue[cursor] : null;
    }

    function insertAtLag(entry, lag) {
      let targetIdx = Math.min(queue.length, cursor + 1 + lag);
      // Avoid immediate back-to-back duplicate of the same key if possible
      if (targetIdx > cursor + 1 && queue[targetIdx - 1] && queue[targetIdx - 1].key === entry.key) {
        targetIdx = Math.min(queue.length, targetIdx + 1);
      }
      if (queue[targetIdx] && queue[targetIdx].key === entry.key) {
        targetIdx = Math.min(queue.length, targetIdx + 1);
      }
      queue.splice(targetIdx, 0, entry);
    }

    /**
     * Record outcome for the current item and advance the cursor.
     * @param {{ correct: boolean, assisted?: boolean }} outcome
     */
    function record({ correct, assisted = false }) {
      const item = current();
      if (!item) return;

      const clean = Boolean(correct) && !assisted;
      if (clean) {
        cleanCount += 1;
        // If this was a first-stage review (lag 2) answered cleanly, schedule
        // one consolidating retrieval 4-5 turns later if room remains.
        if (item.isReview && item.reviewStage === 1 && extraAdded < maxExtraTurns) {
          const used = requeueCounts.get(item.key) || 0;
          if (used < maxRequeuesPerKey) {
            requeueCounts.set(item.key, used + 1);
            extraAdded += 1;
            insertAtLag({ key: item.key, isReview: true, reviewStage: 2 }, 4 + Math.floor(Math.random() * 2));
          }
        }
      } else {
        // Missed or peeked: re-queue 2 turns later (never immediately back-to-back)
        const used = requeueCounts.get(item.key) || 0;
        if (used < maxRequeuesPerKey && extraAdded < maxExtraTurns) {
          requeueCounts.set(item.key, used + 1);
          extraAdded += 1;
          const lag = used === 0 ? 2 : 4;
          insertAtLag({ key: item.key, isReview: true, reviewStage: used + 1 }, lag);
        }
      }

      cursor += 1;
    }

    function isDone() {
      return cursor >= queue.length;
    }

    function progress() {
      return {
        completed: cursor,
        total: queue.length,
        baseLength: roundLength,
        cleanCount
      };
    }

    return { current, record, isDone, progress };
  }

  return { createSession };
})();
