"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bot, Sparkles } from "lucide-react";

import {
  getServerPetPreference,
  getServerPetPersona,
  readPetPersona,
  readPetPreference,
  subscribeToPetPreference,
} from "@/components/pet/pet-preference";

const personaContent = {
  beacon: {
    name: "Beacon",
    hint: "Mission control · hold for chat",
    messages: [
      "Signal clear. You’re on course.",
      "Mission control has your back ✦",
      "Telemetry looks sharp, operator.",
    ],
  },
  orb: {
    name: "Orb",
    hint: "Run an atomic vibe scan",
    messages: [
      "Curiosity is your best exploit ✨",
      "One finding at a time.",
      "Threat model synchronized.",
    ],
  },
  droid: {
    name: "Scout",
    hint: "Scout ready · hold for chat",
    messages: [
      "Perimeter scanned. Keep probing!",
      "Recon complete—you’ve got this.",
      "Scout says: trust, then verify.",
    ],
  },
  sentinel: {
    name: "Sentinel",
    hint: "Sentinel observing · hold for chat",
    messages: [
      "All sectors calm. Continue the hunt.",
      "I found no anomalies—yet.",
      "Sentinel focus locked. Nice work, operator.",
    ],
  },
} as const;

export default function AtomixPet() {
  const enabled = useSyncExternalStore(
    subscribeToPetPreference,
    readPetPreference,
    getServerPetPreference,
  );
  const persona = useSyncExternalStore(
    subscribeToPetPreference,
    readPetPersona,
    getServerPetPersona,
  );
  const [greeting, setGreeting] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [message, setMessage] = useState<string>(personaContent.orb.messages[0]);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const interaction = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    dragged: false,
    held: false,
  });
  const holdTimer = useRef<number | null>(null);
  const sleepTimer = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem("atomix:pet-position") ?? "null");
        if (typeof saved?.x === "number" && typeof saved?.y === "number") {
          setPosition(saved);
        }
      } catch {
        // Ignore a malformed local preference and use the default position.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const scheduleSleep = () => {
      setSleeping(false);
      if (sleepTimer.current) window.clearTimeout(sleepTimer.current);
      sleepTimer.current = window.setTimeout(() => setSleeping(true), 30000);
    };

    const activityEvents = ["pointerdown", "keydown", "scroll"] as const;
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, scheduleSleep, { passive: true }),
    );
    sleepTimer.current = window.setTimeout(() => setSleeping(true), 30000);

    return () => {
      if (sleepTimer.current) window.clearTimeout(sleepTimer.current);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, scheduleSleep),
      );
    };
  }, []);

  const openAgent = () => {
    window.dispatchEvent(new CustomEvent("atomix:open-agent"));
  };

  const showMoraleMessage = () => {
    const messages = personaContent[persona].messages;
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setGreeting(true);
    window.setTimeout(() => setGreeting(false), 2200);
  };

  if (!enabled) return null;

  return (
    <button
      type="button"
      className={`atomix-space-pet atomix-space-pet-${persona} group ${greeting ? "atomix-space-pet-celebrate" : ""} ${sleeping ? "atomix-space-pet-sleeping" : ""}`}
      style={position ? { left: position.x, top: position.y, bottom: "auto" } : undefined}
      aria-label={`${personaContent[persona].name}, the draggable Atomix companion. Hold to open chat.`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openAgent();
      }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        interaction.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          offsetX: event.clientX - bounds.left,
          offsetY: event.clientY - bounds.top,
          dragged: false,
          held: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        holdTimer.current = window.setTimeout(() => {
          interaction.current.held = true;
          openAgent();
        }, 650);
      }}
      onPointerMove={(event) => {
        if (interaction.current.pointerId !== event.pointerId) return;
        const distance = Math.hypot(
          event.clientX - interaction.current.startX,
          event.clientY - interaction.current.startY,
        );
        if (distance > 5) {
          interaction.current.dragged = true;
          if (holdTimer.current) window.clearTimeout(holdTimer.current);
          const next = {
            x: Math.max(8, Math.min(window.innerWidth - 88, event.clientX - interaction.current.offsetX)),
            y: Math.max(8, Math.min(window.innerHeight - 96, event.clientY - interaction.current.offsetY)),
          };
          setPosition(next);
          window.localStorage.setItem("atomix:pet-position", JSON.stringify(next));
        }
      }}
      onPointerUp={(event) => {
        if (holdTimer.current) window.clearTimeout(holdTimer.current);
        if (!interaction.current.dragged && !interaction.current.held) {
          showMoraleMessage();
        }
        interaction.current.pointerId = -1;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        if (holdTimer.current) window.clearTimeout(holdTimer.current);
        interaction.current.pointerId = -1;
      }}
    >
      <span
        className={`atomix-pet-bubble ${greeting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {greeting ? message : personaContent[persona].hint}
      </span>
      <span className="atomix-pet-sleep" aria-hidden="true">z z z</span>
      {persona === "beacon" && (
        <span className="atomix-beacon-pet" aria-hidden="true">
          <span className="atomix-beacon-pulse" />
          <Sparkles size={30} />
          <span className="atomix-beacon-ai">AI</span>
        </span>
      )}
      {persona === "droid" && (
        <span className="atomix-droid-pet" aria-hidden="true">
          <span className="atomix-droid-panel atomix-droid-panel-left" />
          <span className="atomix-droid-panel atomix-droid-panel-right" />
          <span className="atomix-droid-antenna" />
          <span className="atomix-droid-shell">
            <span className="atomix-droid-light" />
            <span className="atomix-droid-lens"><Bot size={14} /></span>
          </span>
          <span className="atomix-droid-hover-ring" />
          <span className="atomix-droid-leg atomix-droid-leg-left" />
          <span className="atomix-droid-leg atomix-droid-leg-right" />
        </span>
      )}
      {persona === "orb" && (
        <span className="atomix-pixel-orb" aria-hidden="true">
          <span className="atomix-pixel-orb-aura" />
          <span className="atomix-pixel-orbit atomix-pixel-orbit-a"><span /></span>
          <span className="atomix-pixel-orbit atomix-pixel-orbit-b"><span /></span>
          <span className="atomix-pixel-orbit atomix-pixel-orbit-c"><span /></span>
          <span className="atomix-pixel-nucleus"><span /></span>
          <span className="atomix-pixel-spark atomix-pixel-spark-a" />
          <span className="atomix-pixel-spark atomix-pixel-spark-b" />
          <span className="atomix-pixel-orb-label">ORB_01</span>
        </span>
      )}
      {persona === "sentinel" && (
        <span className="atomix-sentinel-pet" aria-hidden="true">
          <span className="atomix-sentinel-halo" />
          <span className="atomix-sentinel-shell">
            <span className="atomix-sentinel-segment atomix-sentinel-segment-top" />
            <span className="atomix-sentinel-segment atomix-sentinel-segment-right" />
            <span className="atomix-sentinel-segment atomix-sentinel-segment-bottom" />
            <span className="atomix-sentinel-segment atomix-sentinel-segment-left" />
            <span className="atomix-sentinel-aperture">
              <span className="atomix-sentinel-eye" />
            </span>
          </span>
          <span className="atomix-sentinel-scan" />
        </span>
      )}
    </button>
  );
}
