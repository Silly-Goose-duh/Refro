export type AppPlaybook = {
  whatsNew: string
  tasks: { label: string; taskId: string; extra: string }[]
}

export const APP_PLAYBOOKS: Record<string, AppPlaybook> = {
  github: {
    whatsNew: 'Connect a PAT to review PRs, list issues, and dump repo status. Device Flow is not wired; PAT is the live path.',
    tasks: [
      { label: 'Review my PRs', taskId: 'review-prs', extra: 'Use GitHub. Do not merge.' },
      { label: 'Standup from PRs', taskId: 'standup', extra: 'Prefer GitHub pull requests as the source.' },
    ],
  },
  gmail: {
    whatsNew: 'Token is stored locally. Live Gmail API is not wired yet — triage still runs as an LLM pass until OAuth exists.',
    tasks: [{ label: 'Triage inbox', taskId: 'inbox', extra: 'Treat this as a Gmail pass. Draft only, do not send.' }],
  },
  calendar: {
    whatsNew: 'No Google OAuth yet. Add local events on Home, or connect a token so the app is marked on.',
    tasks: [{ label: 'Daily brief with calendar', taskId: 'daily-brief', extra: 'Lead with upcoming calendar events.' }],
  },
  notion: {
    whatsNew: 'Waiting on a Notion integration secret. Once connected, brief and research can cite pages.',
    tasks: [{ label: 'Brief from notes', taskId: 'daily-brief', extra: 'Prefer Notion notes if connected.' }],
  },
  linear: {
    whatsNew: 'Waiting on a Linear API key for issues and cycles.',
    tasks: [{ label: 'Standup from issues', taskId: 'standup', extra: 'Use Linear issues if connected.' }],
  },
  slack: {
    whatsNew: 'Waiting on a bot token. Automations can then post a channel update.',
    tasks: [{ label: 'Draft a standup for Slack', taskId: 'standup', extra: 'Write it as a Slack message. Do not post.' }],
  },
  browser: {
    whatsNew: 'Marked always-on. Refro does not yet call dsh web_search; dump-config and chat still work.',
    tasks: [{ label: 'Dump dsh config', taskId: 'dump-config', extra: '' }],
  },
}
