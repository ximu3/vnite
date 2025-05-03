export interface RuleSet {
  match: string[]
  replace: string
}

export interface TransformerRule {
  id: string
  name: string
  note: string
  processors: {
    name: RuleSet[]
    originalName: RuleSet[]
    description: RuleSet[]
    developers: RuleSet[]
    publishers: RuleSet[]
    genres: RuleSet[]
    platforms: RuleSet[]
    tags: RuleSet[]
    director: RuleSet[]
    scenario: RuleSet[]
    illustration: RuleSet[]
    music: RuleSet[]
    engine: RuleSet[]
  }
}
