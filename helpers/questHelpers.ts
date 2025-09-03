import { Quest, DEFAULT_QUEST } from '../data/DEFAULT';

export function sortQuestsBy(
  quests: Record<string, Quest>,
  criteria: 'priority' | 'difficulty' | 'dueDate' | 'title' = 'priority'
): string[] {
  return Object.entries(quests)
    .sort(([, a], [, b]) => {
      switch (criteria) {
        case 'priority':
          const priorityOrder = ['high', 'medium', 'low'];
          return priorityOrder.indexOf(a.settings.priority ?? DEFAULT_QUEST.settings.priority ?? 'medium') - priorityOrder.indexOf(b.settings.priority ?? DEFAULT_QUEST.settings.priority ?? 'medium');
        case 'difficulty':
          const diffOrder = ['hard', 'medium', 'easy'];
          return diffOrder.indexOf(a.settings.difficulty ?? DEFAULT_QUEST.settings.difficulty ?? 'medium') - diffOrder.indexOf(b.settings.difficulty ?? DEFAULT_QUEST.settings.difficulty ?? 'medium');
        case 'dueDate':
          return new Date(a.progression.dueDate ?? 0).getTime() - new Date(b.progression.dueDate ?? 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    })
    .map(([id]) => id);
}
