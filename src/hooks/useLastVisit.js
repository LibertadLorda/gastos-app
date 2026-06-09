export function getLastVisit(groupId) {
  const stored = localStorage.getItem(`lastVisit_${groupId}`);
  return stored ? new Date(stored) : null;
}

export function setLastVisit(groupId) {
  localStorage.setItem(`lastVisit_${groupId}`, new Date().toISOString());
}