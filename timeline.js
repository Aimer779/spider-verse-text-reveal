/* Frame times are measured from the supplied 24 fps recording. */
(() => {
  const lines = [
    ['And', 'a', 'lean,', 'silent', 'figure', 'slowly', 'fades', 'into'],
    ['the', 'gathering', 'darkness,', 'aware', 'at', 'last'],
    ['that', 'in', 'this', 'world,', 'with', 'great', 'power', 'there'],
    ['must', 'also', 'come...', 'great', 'responsibility!'],
  ];
  const starts = [0, .12, .23, .43, .63, .76, .94, 1.1,
    1.25, 1.37, 1.54, 1.75, 1.89, 1.98, 2.12, 2.23, 2.33,
    2.45, 2.76, 2.88, 3.03, 3.16, 3.28, 3.4, 3.53, 4.36, 4.49];
  const panels = new Set([1, 2, 3, 5, 8, 11, 14, 17, 18, 23, 24]);
  // Exit order preserves layout holes; it does not reverse the entrance.
  const exitOrder = [0, 6, 24, 26, 1, 3, 21, 17, 20, 16, 25, 9, 10, 2, 5, 23, 19, 7, 12, 22, 4, 8, 18, 11, 14, 13, 15];
  const accents = [{ at: 4.98, ids: [3], type: 'panel', duration: .2 },
    { at: 145 / 24, ids: [14,15,16,17,18,19,20,21], type: 'chromatic', duration: 1 / 24 },
    { at: 6, ids: [22,23,24,25,26], type: 'chromatic', duration: .14 },
    { at: 6.48, ids: [20], type: 'dust', duration: .15 },
    { at: 7.36, ids: [26], type: 'panel', duration: .19 }];
  // Lower portions translate as one print strip; they are not RGB ghosts.
  // Frame indices and pixel offsets come from the 1920×1200 source.
  const slices = [
    { start: 103, end: 104, ids: [0,1,2,3,4,5,6,7], cut: 48, offset: 36 },
    { start: 142, end: 145, ids: [14,15,16,17,18,19,20,21], cut: 63, offset: 17 },
    { start: 189, end: 200, ids: [8,9,10,11,12,13], cut: 40, offset: -17 },
  ];
  const words = lines.flat().map((text, id) => ({
    text, id, start: starts[id], panel: panels.has(id),
    exit: 8.88 + exitOrder.indexOf(id) * .03,
  }));
  function sample(word, time, effectLength = 1) {
    if (time < word.start || time >= word.exit + .18 * effectLength) return { state: 'hidden', strength: 0 };
    if (time >= word.exit) {
      const age = (time - word.exit) / effectLength;
      return { state: age < .08 && word.id % 3 !== 0 ? 'panel' : 'dust', strength: .6 + age * 3, exiting: true };
    }
    const age = (time - word.start) / effectLength;
    if (age < .32) return { state: age < .13 ? (word.panel ? 'panel' : 'dust') : 'chromatic', strength: 1 - age / .36 };
    const slice = slices.find(item => time >= item.start / 24 && time < item.end / 24 && item.ids.includes(word.id));
    if (slice) return { state: 'slice', strength: 0, cut: slice.cut, offset: slice.offset };
    for (const accent of accents) {
      if (time >= accent.at && time < accent.at + accent.duration * effectLength && accent.ids.includes(word.id))
        return { state: accent.type, strength: .85 };
    }
    return { state: 'settled', strength: 0 };
  }
  globalThis.RevealTimeline = { lines, words, sample, duration: 10.5, videoDuration: 9.875 };
})();
