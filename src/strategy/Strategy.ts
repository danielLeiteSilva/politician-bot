import { WebhookBody } from "../types"

export interface RunnableStrategy {
  new (body: WebhookBody): { run(): Promise<void> }
}

export class Strategy {
  private body: WebhookBody

  constructor(body: WebhookBody) {
    this.body = body
  }

  async runner(StrategyClass: RunnableStrategy): Promise<void> {
    await new StrategyClass(this.body).run()
  }
}
