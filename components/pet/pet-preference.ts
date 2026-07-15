export const PET_STORAGE_KEY = "atomix:pet-enabled";
export const PET_PREFERENCE_EVENT = "atomix:pet-preference-changed";
export const PET_PERSONA_KEY = "atomix:pet-persona";

export type PetPersona = "beacon" | "orb" | "droid";

export function readPetPreference() {
  return window.localStorage.getItem(PET_STORAGE_KEY) !== "false";
}

export function savePetPreference(enabled: boolean) {
  window.localStorage.setItem(PET_STORAGE_KEY, String(enabled));
  window.dispatchEvent(
    new CustomEvent(PET_PREFERENCE_EVENT, { detail: { enabled } }),
  );
}

export function readPetPersona(): PetPersona {
  const value = window.localStorage.getItem(PET_PERSONA_KEY);
  return value === "beacon" || value === "droid" ? value : "orb";
}

export function savePetPersona(persona: PetPersona) {
  window.localStorage.setItem(PET_PERSONA_KEY, persona);
  window.dispatchEvent(new CustomEvent(PET_PREFERENCE_EVENT));
}

export function getServerPetPersona(): PetPersona {
  return "orb";
}

export function subscribeToPetPreference(onChange: () => void) {
  const handleChange = () => onChange();
  window.addEventListener(PET_PREFERENCE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(PET_PREFERENCE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getServerPetPreference() {
  return true;
}
