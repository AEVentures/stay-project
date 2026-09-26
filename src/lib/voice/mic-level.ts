/**
 * Reads microphone amplitude (0..1) so Ember can visibly react while the
 * user speaks. Audio never leaves the AnalyserNode; nothing is recorded.
 */
export class MicLevel {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private frame = 0;
  private smoothed = 0;

  constructor(private readonly onLevel: (level: number) => void) {}

  async start(): Promise<void> {
    if (this.context) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.6;
    source.connect(this.analyser);
    this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.tick();
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();
    this.context = null;
    this.stream = null;
    this.analyser = null;
    this.data = null;
    this.smoothed = 0;
    this.onLevel(0);
  }

  private tick = (): void => {
    if (!this.analyser || !this.data) return;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (const sample of this.data) {
      const centered = (sample - 128) / 128;
      sum += centered * centered;
    }
    const rms = Math.sqrt(sum / this.data.length);
    const level = Math.min(1, rms * 4);
    this.smoothed = this.smoothed * 0.7 + level * 0.3;
    this.onLevel(this.smoothed);
    this.frame = requestAnimationFrame(this.tick);
  };
}
