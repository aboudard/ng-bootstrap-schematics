export interface InfoActuator {
  app: App;
  git: Git;
  build: Build;
}

interface Build {
  artifact: string;
  name: string;
  time: string;
  version: string;
  group: string;
}

interface Git {
  branch: string;
  commit: Commit;
}

interface Commit {
  id: string;
  time: string;
}

interface App {
  version: string;
  env: string;
}
