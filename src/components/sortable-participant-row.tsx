"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: string;
  gi: number;
  displayNr: number;
  n: number;
  name: string;
  shuffleBurst: boolean;
  tableCellGripClass: string;
  nrCellClass: string;
  tableCellClass: string;
  onNameChange: (index: number, value: string) => void;
  moveParticipantRow: (from: number, to: number) => void;
};

export function SortableParticipantRow({
  id,
  gi,
  displayNr,
  n,
  name,
  shuffleBurst,
  tableCellGripClass,
  nrCellClass,
  tableCellClass,
  onNameChange,
  moveParticipantRow,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
    position: "relative",
    ...(shuffleBurst ? { animationDelay: `${gi * 42}ms` } : {}),
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`bg-app-card odd:bg-app-surface/30 ${
        shuffleBurst ? "tw-shuffle-row-active" : ""
      } ${isDragging ? "shadow-md ring-2 ring-app-primary/35" : ""}`}
    >
      <td className={tableCellGripClass}>
        <button
          type="button"
          className="flex h-full min-h-[2.75rem] w-full cursor-grab touch-none items-center justify-center text-app-muted outline-none active:cursor-grabbing hover:bg-app-surface/60 hover:text-app-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-ring/40"
          aria-label={`Teilnehmer ${displayNr} verschieben`}
          title="Ziehen zum Sortieren"
          {...attributes}
          {...listeners}
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              if (e.key === "ArrowUp" && gi > 0) moveParticipantRow(gi, gi - 1);
              if (e.key === "ArrowDown" && gi < n - 1)
                moveParticipantRow(gi, gi + 1);
            }
          }}
        >
          <span aria-hidden className="flex flex-col gap-0.5 px-1">
            <span className="h-0.5 w-4 rounded-full bg-current opacity-60" />
            <span className="h-0.5 w-4 rounded-full bg-current opacity-60" />
            <span className="h-0.5 w-4 rounded-full bg-current opacity-60" />
          </span>
        </button>
      </td>
      <td className={nrCellClass}>{displayNr}</td>
      <td className={tableCellClass}>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(gi, e.target.value)}
          placeholder={`${displayNr}. Teilnehmer`}
          className="h-full w-full min-h-[2.75rem] border-0 bg-transparent px-3 py-2 text-app-ink outline-none focus:ring-2 focus:ring-inset focus:ring-app-ring/30"
          autoComplete="off"
        />
      </td>
    </tr>
  );
}
