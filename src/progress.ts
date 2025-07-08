/**
 * Progress indicator for file operations
 */
export class ProgressIndicator {
  private totalSteps: number;
  private currentStep: number;
  private startTime: number;
  private isEnabled: boolean;

  constructor(totalSteps: number = 0, isEnabled: boolean = true) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.startTime = Date.now();
    this.isEnabled = isEnabled;
  }

  /**
   * Start a new progress with a given number of steps
   * @param totalSteps - Total number of steps
   * @param message - Initial message to display
   */
  start(totalSteps: number, message?: string): void {
    if (!this.isEnabled) return;
    
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.startTime = Date.now();
    
    if (message) {
      console.log(`\n${message}`);
    }
    
    this.render();
  }

  /**
   * Update progress by incrementing the current step
   * @param message - Optional message to display
   */
  increment(message?: string): void {
    if (!this.isEnabled) return;
    
    this.currentStep++;
    
    if (message) {
      this.clearLine();
      console.log(`   ✓ ${message}`);
    }
    
    this.render();
  }

  /**
   * Complete the progress
   * @param message - Final message to display
   */
  complete(message?: string): void {
    if (!this.isEnabled) return;
    
    this.currentStep = this.totalSteps;
    this.clearLine();
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`\n✨ ${message || "Complete!"} (${elapsed}s)\n`);
  }

  /**
   * Clear the current line in the console
   * @private
   */
  private clearLine(): void {
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
  }

  /**
   * Render the progress bar
   * @private
   */
  private render(): void {
    if (!process.stdout.isTTY || this.totalSteps === 0) return;
    
    const percent = Math.round((this.currentStep / this.totalSteps) * 100);
    const barLength = 30;
    const filled = Math.round((barLength * this.currentStep) / this.totalSteps);
    const empty = barLength - filled;
    
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const progress = `[${bar}] ${percent}% (${this.currentStep}/${this.totalSteps})`;
    
    this.clearLine();
    process.stdout.write(progress);
  }

  /**
   * Create a simple spinner for indeterminate progress
   * @param message - Message to display
   * @returns Object with start and stop methods
   */
  static createSpinner(message: string): { start: () => void; stop: () => void } {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    let interval: NodeJS.Timeout | null = null;

    return {
      start: () => {
        if (!process.stdout.isTTY) {
          console.log(message);
          return;
        }
        
        interval = setInterval(() => {
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(`${frames[i]} ${message}`);
          i = (i + 1) % frames.length;
        }, 80);
      },
      stop: () => {
        if (interval) {
          clearInterval(interval);
          if (process.stdout.isTTY) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
          }
        }
      }
    };
  }
}