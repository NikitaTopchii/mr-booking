export interface SqlitePragmaState {
  readonly journalMode: 'wal';
  readonly foreignKeys: 1;
  readonly busyTimeoutMilliseconds: 5000;
}
