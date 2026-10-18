import type { ProductionLine } from '../domain/types';

// Demo plant model. Replace envelopes, formats and SKUs with your own line data in the Production screen.
export const LINES: ProductionLine[] = [
  {
    id: 'L1', plant: 'Plant A', name: 'Line 1 · High-speed oval', targetBpm: 220, oeePct: 74, changeoverMin: 45,
    skus: [
      { name: 'Head & Shoulders Classic Clean 400 ml', bottleId: 'b-oval-400', closureId: 'c-flip-24', bpm: 220 },
      { name: 'Head & Shoulders Classic Clean 650 ml', bottleId: 'b-oval-650', closureId: 'c-flip-28', bpm: 190 },
      { name: 'Head & Shoulders Cool Menthol 180 ml', bottleId: 'b-oval-180', closureId: 'c-flip-24', bpm: 240 },
    ],
    machines: [
      { id: 'L1-UNS', type: 'unscrambler', name: 'Rotary unscrambler', maxBpm: 260, heightMm: [110, 260], widthMm: [40, 95], depthMm: [25, 65], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36'] },
      { id: 'L1-RIN', type: 'rinser', name: 'Ionised-air rinser', maxBpm: 260, heightMm: [100, 270], widthMm: [35, 100], depthMm: [25, 70], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36'] },
      { id: 'L1-FIL', type: 'filler', name: '24-head flowmeter filler', maxBpm: 230, heightMm: [110, 260], widthMm: [40, 95], depthMm: [25, 65], fillMl: [150, 800], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36'] },
      { id: 'L1-CFD', type: 'cap-feeder', name: 'Centrifugal cap sorter', maxBpm: 260, heightMm: [0, 9999], widthMm: [0, 9999], depthMm: [0, 9999], closureTypes: ['flip-top', 'screw', 'disc-top'], formats: ['cap-30', 'cap-34', 'cap-28'] },
      { id: 'L1-CAP', type: 'capper', name: '8-head chuck capper', maxBpm: 240, heightMm: [110, 260], widthMm: [40, 95], depthMm: [25, 65], neckFinishes: ['24/410', '28/410', '20/410'], closureTypes: ['flip-top', 'screw', 'disc-top'], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36', 'cap-30', 'cap-34'] },
      { id: 'L1-LAB', type: 'labeller', name: 'Front-back PS labeller', maxBpm: 240, heightMm: [110, 260], widthMm: [40, 95], depthMm: [25, 65], decorationTypes: ['ps-label', 'hot-foil'], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36'] },
      { id: 'L1-COD', type: 'coder-vision', name: 'Laser coder + vision', maxBpm: 300, heightMm: [80, 300], widthMm: [30, 110], depthMm: [20, 80], formats: ['any'] },
      { id: 'L1-CHK', type: 'checkweigher', name: 'Checkweigher', maxBpm: 300, heightMm: [80, 300], widthMm: [30, 110], depthMm: [20, 80], formats: ['any'] },
      { id: 'L1-CSP', type: 'case-packer', name: 'Wrap-around case packer', maxBpm: 250, heightMm: [100, 270], widthMm: [35, 100], depthMm: [25, 70], formats: ['oval-72x46', 'oval-84x54', 'oval-58x36'] },
    ],
  },
  {
    id: 'L2', plant: 'Plant A', name: 'Line 2 · Pump and premium', targetBpm: 120, oeePct: 68, changeoverMin: 60,
    skus: [
      { name: 'Pantene Conditioner 650 ml pump', bottleId: 'b-oval-650', closureId: 'c-pump-28', bpm: 110 },
      { name: 'Herbal Essences Shampoo 340 ml', bottleId: 'b-cyl-340', closureId: 'c-flip-24', bpm: 130 },
    ],
    machines: [
      { id: 'L2-UNS', type: 'unscrambler', name: 'Robotic pick-and-place infeed', maxBpm: 150, heightMm: [100, 280], widthMm: [35, 110], depthMm: [25, 110], formats: ['oval-84x54', 'cylinder-58x58'] },
      { id: 'L2-RIN', type: 'rinser', name: 'Inverting air rinser', maxBpm: 160, heightMm: [100, 280], widthMm: [35, 110], depthMm: [25, 110], formats: ['oval-84x54', 'cylinder-58x58'] },
      { id: 'L2-FIL', type: 'filler', name: '12-head servo piston filler', maxBpm: 140, heightMm: [100, 280], widthMm: [35, 110], depthMm: [25, 110], fillMl: [100, 1000], formats: ['oval-84x54', 'cylinder-58x58'] },
      { id: 'L2-CFD', type: 'cap-feeder', name: 'Pump orienting feeder + pick-and-place', maxBpm: 130, heightMm: [0, 9999], widthMm: [0, 9999], depthMm: [0, 9999], closureTypes: ['pump', 'foam-pump', 'flip-top', 'disc-top'], formats: ['pump-34', 'cap-30'] },
      { id: 'L2-CAP', type: 'capper', name: 'Servo spindle capper', maxBpm: 140, heightMm: [100, 330], widthMm: [35, 110], depthMm: [25, 110], neckFinishes: ['24/410', '28/410'], closureTypes: ['pump', 'foam-pump', 'flip-top', 'disc-top', 'screw'], formats: ['oval-84x54', 'cylinder-58x58', 'pump-34', 'cap-30'] },
      { id: 'L2-LAB', type: 'labeller', name: 'Wrap + front-back labeller', maxBpm: 150, heightMm: [100, 330], widthMm: [35, 110], depthMm: [25, 110], decorationTypes: ['ps-label', 'hot-foil'], formats: ['oval-84x54', 'cylinder-58x58'] },
      { id: 'L2-SLV', type: 'sleeve-tunnel', name: 'Sleever + steam tunnel', maxBpm: 150, heightMm: [100, 330], widthMm: [35, 110], depthMm: [25, 110], decorationTypes: ['shrink-sleeve'], formats: ['cylinder-58x58'] },
      { id: 'L2-COD', type: 'coder-vision', name: 'Inkjet coder + vision', maxBpm: 200, heightMm: [80, 330], widthMm: [30, 120], depthMm: [20, 120], formats: ['any'] },
      { id: 'L2-CHK', type: 'checkweigher', name: 'Checkweigher', maxBpm: 200, heightMm: [80, 330], widthMm: [30, 120], depthMm: [20, 120], formats: ['any'] },
      { id: 'L2-CSP', type: 'case-packer', name: 'Robotic case packer', maxBpm: 160, heightMm: [100, 330], widthMm: [35, 120], depthMm: [25, 120], formats: ['oval-84x54', 'cylinder-58x58'] },
    ],
  },
  {
    id: 'L3', plant: 'Plant B', name: 'Line 3 · Value and small packs', targetBpm: 300, oeePct: 78, changeoverMin: 30,
    skus: [
      { name: 'Head & Shoulders 80 ml (India)', bottleId: 'b-in-oval-80', closureId: 'c-in-flip-20', bpm: 320 },
      { name: 'Pantene 340 ml (India)', bottleId: 'b-in-oval-340', closureId: 'c-in-flip-24', bpm: 260 },
    ],
    machines: [
      { id: 'L3-UNS', type: 'unscrambler', name: 'Linear unscrambler', maxBpm: 340, heightMm: [90, 210], widthMm: [30, 75], depthMm: [20, 50], formats: ['oval-46x28', 'oval-68x43'] },
      { id: 'L3-FIL', type: 'filler', name: '16-head gravity-volumetric filler', maxBpm: 320, heightMm: [90, 210], widthMm: [30, 75], depthMm: [20, 50], fillMl: [50, 400], formats: ['oval-46x28', 'oval-68x43'] },
      { id: 'L3-CFD', type: 'cap-feeder', name: 'Vibratory cap feeder', maxBpm: 340, heightMm: [0, 9999], widthMm: [0, 9999], depthMm: [0, 9999], closureTypes: ['flip-top', 'screw'], formats: ['cap-25', 'cap-30'] },
      { id: 'L3-CAP', type: 'capper', name: 'Inline press-on/screw capper', maxBpm: 320, heightMm: [90, 210], widthMm: [30, 75], depthMm: [20, 50], neckFinishes: ['20/410', '24/410'], closureTypes: ['flip-top', 'screw'], formats: ['oval-46x28', 'oval-68x43', 'cap-25', 'cap-30'] },
      { id: 'L3-LAB', type: 'labeller', name: 'Wrap labeller', maxBpm: 320, heightMm: [90, 210], widthMm: [30, 75], depthMm: [20, 50], decorationTypes: ['ps-label'], formats: ['oval-46x28', 'oval-68x43'] },
      { id: 'L3-COD', type: 'coder-vision', name: 'Inkjet coder', maxBpm: 400, heightMm: [60, 250], widthMm: [20, 90], depthMm: [15, 70], formats: ['any'] },
      { id: 'L3-CSP', type: 'case-packer', name: 'Shrink bundler + case', maxBpm: 340, heightMm: [80, 220], widthMm: [25, 80], depthMm: [15, 60], formats: ['oval-46x28', 'oval-68x43'] },
    ],
  },
];
