import Phaser from 'phaser';

const ACCEL = 1300; // px/s^2
const ARRIVE_EPS = 2; // px
const STRIDE_RATE = 0.021; // stride phase per px travelled
const BOB_HEIGHT = 2.4; // px

// The girl. Accelerates and brakes smoothly instead of tweening, so mid-walk
// retargeting never snaps, and plays a two-frame stride with a light bob.
export class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private targetX: number | null = null;
  private onArrive?: () => void;
  private vel = 0;
  private stridePhase = 0;
  private readonly maxSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, maxSpeed = 230) {
    super(scene, x, y);
    this.maxSpeed = maxSpeed;
    this.sprite = scene.add.image(0, 0, 'girl-idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    scene.add.existing(this);
  }

  get isMoving(): boolean {
    return this.targetX !== null;
  }

  face(directionX: number): void {
    this.sprite.setFlipX(directionX < this.x);
  }

  walkTo(targetX: number, onArrive?: () => void): void {
    this.targetX = targetX;
    this.onArrive = onArrive;
  }

  halt(): void {
    this.targetX = null;
    this.onArrive = undefined;
    this.vel = 0;
  }

  /** Call from the scene's update() every frame. */
  update(delta: number): void {
    const dt = Math.min(delta, 50) / 1000; // clamp huge deltas (tab wake-up)
    if (this.targetX === null) {
      this.stridePhase = 0;
      this.sprite.setTexture('girl-idle');
      this.sprite.y = 0;
      return;
    }

    const dist = this.targetX - this.x;
    const dir = Math.sign(dist) || 1;

    if (Math.abs(dist) <= ARRIVE_EPS && Math.abs(this.vel) < this.maxSpeed * 0.6) {
      this.x = this.targetX;
      const cb = this.onArrive;
      this.halt();
      this.sprite.setTexture('girl-idle');
      this.sprite.y = 0;
      cb?.();
      return;
    }

    this.sprite.setFlipX(dir < 0);

    // accelerate, but never faster than we can brake to a stop at the target
    const brakeLimit = Math.sqrt(2 * ACCEL * Math.abs(dist));
    const targetVel = dir * Math.min(this.maxSpeed, brakeLimit);
    const dv = Phaser.Math.Clamp(targetVel - this.vel, -ACCEL * dt, ACCEL * dt);
    this.vel += dv;
    this.x += this.vel * dt;

    // stride animation + bob, both driven by actual distance travelled
    this.stridePhase += Math.abs(this.vel) * dt * STRIDE_RATE;
    this.sprite.setTexture(Math.floor(this.stridePhase * 2) % 2 === 0 ? 'girl-walk-a' : 'girl-walk-b');
    this.sprite.y = -Math.abs(Math.sin(this.stridePhase * Math.PI)) * BOB_HEIGHT;
  }
}
