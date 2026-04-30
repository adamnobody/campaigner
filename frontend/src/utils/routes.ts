export const routes = {
  project: (pid: number | string) => `/project/${pid}`,

  characters: (pid: number | string) => `/project/${pid}/characters`,
  characterDetail: (pid: number | string, id: number | 'new') => `/project/${pid}/characters/${id}`,
  charactersGraph: (pid: number | string) => `/project/${pid}/characters/graph`,

  dynasties: (pid: number | string) => `/project/${pid}/dynasties`,
  dynastyDetail: (pid: number | string, id: number | 'new') => `/project/${pid}/dynasties/${id}`,

  dogmas: (pid: number | string) => `/project/${pid}/dogmas`,

  factionList: (pid: number | string, kind: 'state' | 'faction') =>
    `/project/${pid}/${kind === 'state' ? 'states' : 'factions'}`,

  factionDetail: (pid: number | string, kind: 'state' | 'faction', id: number | 'new') =>
    `${routes.factionList(pid, kind)}/${id}`,
};
