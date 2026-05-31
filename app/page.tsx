"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileAudio,
  FileVideo,
  FolderDown,
  ListVideo,
  PlayCircle,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";

type SourceType = "single" | "playlist";
type Step = "intake" | "single" | "playlist";

type AppState = {
  url: string;
  videoId: string;
  originalTitle: string;
  filename: string;
  sourceType: SourceType;
};

const WINDOWS_RESERVED_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9"
]);

const SAMPLE_TITLES = [
  "Kaijuu Protocol - Episode 08 Breakdown",
  "Night Ops Playlist - Tactical Audio Mix",
  "Shin Hachigou Training Log",
  "Monster Class Backend Architecture"
];

function isProbablyYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      /(^|\.)youtube\.com$/.test(parsed.hostname) ||
      /(^|\.)youtu\.be$/.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function extractYouTubeId(url: string): string {
  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").slice(0, 11);
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) return watchId.slice(0, 11);

    if (parsed.pathname.includes("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1]?.split("/")[0]?.slice(0, 11) ?? "";
    }

    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/embed/")[1]?.split("/")[0]?.slice(0, 11) ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

function detectSourceType(url: string): SourceType {
  try {
    const parsed = new URL(url.trim());
    return parsed.searchParams.get("list") ? "playlist" : "single";
  } catch {
    return "single";
  }
}

function getMockTitle(url: string): string {
  const id = extractYouTubeId(url);
  if (!id) return "";

  let score = 0;
  for (const char of id) score += char.charCodeAt(0);

  return SAMPLE_TITLES[score % SAMPLE_TITLES.length];
}

function sanitizeWindowsFilename(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/[ .]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function validateWindowsFilename(name: string): string[] {
  const trimmed = name.trim();
  const failures: string[] = [];

  if (!trimmed) failures.push("Filename cannot be empty.");
  if (/[<>:"/\\|?*]/.test(trimmed)) {
    failures.push('Filename cannot contain: < > : " / \\ | ? *');
  }
  if (/[\x00-\x1F]/.test(trimmed)) {
    failures.push("Filename cannot contain control characters.");
  }
  if (/[ .]$/.test(trimmed)) {
    failures.push("Filename cannot end with a space or period.");
  }
  if (trimmed.length > 180) {
    failures.push("Filename should stay under 180 characters before extension.");
  }

  const base = trimmed.split(".")[0].toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(base)) {
    failures.push(
      "Filename cannot use a Windows reserved name such as CON, PRN, AUX, NUL, COM1, or LPT1."
    );
  }

  return failures;
}

function Pill({
  children,
  active = false,
  icon: Icon
}: {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs tracking-wide",
        active
          ? "border-kaijuu-cyan text-kaijuu-cyan"
          : "border-kaijuu-border text-kaijuu-muted"
      ].join(" ")}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  icon: Icon
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <section className="rounded-2xl border border-kaijuu-border bg-kaijuu-panel/90 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-kaijuu-cyan" /> : null}
          <h2 className="text-lg font-semibold text-kaijuu-text">{title}</h2>
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-kaijuu-muted">{subtitle}</p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-kaijuu-text">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-kaijuu-border bg-kaijuu-bg px-4 py-3 text-sm text-kaijuu-text outline-none transition focus:border-kaijuu-cyan"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-kaijuu-muted" />
      </div>
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-kaijuu-text">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="00:00:00"
        className="w-full rounded-xl border border-kaijuu-border bg-kaijuu-bg px-4 py-3 text-sm text-kaijuu-text outline-none transition placeholder:text-kaijuu-muted/60 focus:border-kaijuu-cyan"
      />
    </label>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-kaijuu-border bg-kaijuu-bg/70 p-4 text-left transition hover:border-kaijuu-cyan/70"
    >
      <div>
        <div className="text-sm font-medium text-kaijuu-text">{title}</div>
        <div className="mt-1 text-xs text-kaijuu-muted">{subtitle}</div>
      </div>

      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full border transition",
          checked
            ? "border-kaijuu-cyan bg-kaijuu-cyan/30"
            : "border-kaijuu-border bg-kaijuu-elevated"
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full transition",
            checked ? "left-5 bg-kaijuu-cyan" : "left-0.5 bg-kaijuu-muted"
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function AppHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-kaijuu-cyan/50 bg-kaijuu-cyan/10 shadow-lg shadow-kaijuu-cyan/10">
          <Sparkles className="h-5 w-5 text-kaijuu-cyan" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-kaijuu-text">
            Hachigou DL
          </h1>
          <p className="text-sm text-kaijuu-muted">
            Kaijuu Capture / YouTube media workflow prototype
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Pill active icon={ShieldAlert}>
          Frontend mock
        </Pill>
        <Pill icon={FolderDown}>No backend yet</Pill>
      </div>
    </header>
  );
}

function IntakeScreen({
  state,
  setState,
  onInitiate
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onInitiate: () => void;
}) {
  const isYouTube = useMemo(() => isProbablyYouTubeUrl(state.url), [state.url]);
  const embedUrl = state.videoId
    ? `https://www.youtube.com/embed/${state.videoId}`
    : "";

  const filenameFailures = useMemo(
    () => validateWindowsFilename(state.filename),
    [state.filename]
  );

  const canInitiate =
    Boolean(state.videoId) && isYouTube && filenameFailures.length === 0;

  function handleUrlChange(nextUrl: string) {
    const videoId = extractYouTubeId(nextUrl);
    const title = getMockTitle(nextUrl);

    setState((previous) => ({
      ...previous,
      url: nextUrl,
      videoId,
      sourceType: detectSourceType(nextUrl),
      originalTitle: title,
      filename: title ? sanitizeWindowsFilename(title) : previous.filename
    }));
  }

  return (
    <motion.main
      key="intake"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto grid w-full max-w-6xl gap-5 px-5 pb-12 lg:grid-cols-[1.15fr_0.85fr]"
    >
      <Section
        title="Target URL / Mokuhyou"
        subtitle="Paste a YouTube video or playlist URL. Metadata is mocked for the frontend prototype."
        icon={PlayCircle}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-kaijuu-text">
              YouTube URL
            </span>

            <input
              value={state.url}
              onChange={(event) => handleUrlChange(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-kaijuu-border bg-kaijuu-bg px-4 py-3 text-sm text-kaijuu-text outline-none transition placeholder:text-kaijuu-muted/60 focus:border-kaijuu-cyan"
            />
          </label>

          {state.url && !isYouTube ? (
            <div className="flex items-start gap-2 rounded-xl border border-kaijuu-magenta/50 bg-kaijuu-magenta/10 p-3 text-sm text-pink-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Enter a valid youtube.com or youtu.be URL.
            </div>
          ) : null}

          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="block text-sm font-medium text-kaijuu-text">
                Filename / Namae
              </span>

              {state.originalTitle ? (
                <span className="text-xs text-kaijuu-muted">
                  Autofilled from mocked title
                </span>
              ) : null}
            </div>

            <input
              value={state.filename}
              onChange={(event) =>
                setState((previous) => ({
                  ...previous,
                  filename: event.target.value
                }))
              }
              placeholder="Video title becomes the file name"
              className={[
                "w-full rounded-xl border bg-kaijuu-bg px-4 py-3 text-sm text-kaijuu-text outline-none transition placeholder:text-kaijuu-muted/60",
                filenameFailures.length
                  ? "border-kaijuu-magenta focus:border-kaijuu-magenta"
                  : "border-kaijuu-border focus:border-kaijuu-cyan"
              ].join(" ")}
            />
          </label>

          {filenameFailures.length ? (
            <div className="rounded-xl border border-kaijuu-magenta/50 bg-kaijuu-magenta/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-200">
                <AlertTriangle className="h-4 w-4" />
                Filename rules failed
              </div>

              <ul className="list-inside list-disc space-y-1 text-sm text-pink-100">
                {filenameFailures.map((failure) => (
                  <li key={failure}>{failure}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    filename: sanitizeWindowsFilename(
                      previous.filename || previous.originalTitle
                    )
                  }))
                }
                className="mt-3 rounded-lg border border-kaijuu-magenta/60 px-3 py-2 text-xs font-semibold text-pink-100 transition hover:bg-kaijuu-magenta/10"
              >
                Auto-fix / Naosu
              </button>
            </div>
          ) : state.filename ? (
            <div className="flex items-center gap-2 rounded-xl border border-kaijuu-green/40 bg-kaijuu-green/10 p-3 text-sm text-green-100">
              <CheckCircle2 className="h-4 w-4" />
              Filename is valid for Windows.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Pill active={Boolean(state.videoId)} icon={FileVideo}>
              {state.videoId ? "Video ID detected" : "Waiting for URL"}
            </Pill>

            <Pill active={state.sourceType === "playlist"} icon={ListVideo}>
              {state.sourceType === "playlist"
                ? "Playlist / Ichiran"
                : "Single / Tanpin"}
            </Pill>
          </div>

          <button
            type="button"
            disabled={!canInitiate}
            onClick={onInitiate}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-kaijuu-cyan/60 bg-kaijuu-cyan px-5 py-4 text-sm font-bold text-black shadow-xl shadow-kaijuu-cyan/10 transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-kaijuu-cyan/20 disabled:cursor-not-allowed disabled:border-kaijuu-border disabled:bg-kaijuu-elevated disabled:text-kaijuu-muted"
          >
            <Download className="h-4 w-4" />
            Initiate Download / Kaishi
          </button>
        </div>
      </Section>

      <Section
        title="Embed Preview / Mite"
        subtitle="The real backend later fetches verified metadata and prepares the download."
        icon={FileVideo}
      >
        <div className="overflow-hidden rounded-2xl border border-kaijuu-border bg-black">
          {embedUrl ? (
            <iframe
              title="YouTube preview"
              src={embedUrl}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="grid aspect-video place-items-center bg-kaijuu-bg p-6 text-center">
              <div>
                <PlayCircle className="mx-auto mb-3 h-11 w-11 text-kaijuu-border" />
                <p className="text-sm text-kaijuu-muted">
                  Paste a YouTube URL to show the embedded preview.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-kaijuu-border bg-kaijuu-bg/70 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-kaijuu-muted">
            Detected output name
          </div>

          <div className="mt-2 break-words text-sm font-medium text-kaijuu-text">
            {state.filename || "No filename yet"}
          </div>
        </div>
      </Section>
    </motion.main>
  );
}

function SingleVideoScreen({
  state,
  onBack
}: {
  state: AppState;
  onBack: () => void;
}) {
  const [single, setSingle] = useState({
    mode: "Douga / Video",
    startTime: "",
    endTime: "",
    videoQuality: "Best",
    audioFormat: "mp3",
    audioQuality: "Best",
    outputFolder: "Browser Downloads",
    filenamePattern: "Title",
    remux: "mp4"
  });

  const commandPreview = useMemo(() => {
    const range =
      single.startTime || single.endTime
        ? ` --download-sections "*${single.startTime || "00:00:00"}-${
            single.endTime || "end"
          }"`
        : "";

    if (single.mode === "Koe / Audio") {
      return `yt-dlp -x --audio-format ${single.audioFormat} --audio-quality ${single.audioQuality}${range} -o "${state.filename}.%(ext)s" "${state.url}"`;
    }

    return `yt-dlp -f "bestvideo+bestaudio/best" --remux-video ${single.remux}${range} -o "${state.filename}.%(ext)s" "${state.url}"`;
  }, [single, state.filename, state.url]);

  return (
    <motion.main
      key="single"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl px-5 pb-12"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Pill active icon={FileVideo}>
            Single video / Tanpin
          </Pill>

          <h2 className="mt-3 text-2xl font-bold text-kaijuu-text">
            Configure media output
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-kaijuu-muted">
            The intake UI is hidden. The app now shows only single-video options.
          </p>
        </div>

        <button
          onClick={onBack}
          className="rounded-xl border border-kaijuu-border px-4 py-2 text-sm text-kaijuu-muted transition hover:border-kaijuu-cyan hover:text-kaijuu-cyan"
        >
          Back / Modoru
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Section
          title="Core options / Sentaku"
          subtitle="Minimal controls first; advanced behavior comes later."
          icon={FileVideo}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Mode"
              value={single.mode}
              onChange={(mode) => setSingle((previous) => ({ ...previous, mode }))}
              options={["Douga / Video", "Koe / Audio"]}
            />

            <SelectField
              label="Video quality"
              value={single.videoQuality}
              onChange={(videoQuality) =>
                setSingle((previous) => ({ ...previous, videoQuality }))
              }
              options={["Best", "1080p", "720p", "480p"]}
            />

            <TimeField
              label="Start time / Kaishi"
              value={single.startTime}
              onChange={(startTime) =>
                setSingle((previous) => ({ ...previous, startTime }))
              }
            />

            <TimeField
              label="End time / Owari"
              value={single.endTime}
              onChange={(endTime) =>
                setSingle((previous) => ({ ...previous, endTime }))
              }
            />

            <SelectField
              label="Audio format"
              value={single.audioFormat}
              onChange={(audioFormat) =>
                setSingle((previous) => ({ ...previous, audioFormat }))
              }
              options={["mp3", "m4a", "opus", "wav", "flac"]}
            />

            <SelectField
              label="Audio quality"
              value={single.audioQuality}
              onChange={(audioQuality) =>
                setSingle((previous) => ({ ...previous, audioQuality }))
              }
              options={["Best", "320K", "192K", "128K"]}
            />

            <SelectField
              label="Output folder"
              value={single.outputFolder}
              onChange={(outputFolder) =>
                setSingle((previous) => ({ ...previous, outputFolder }))
              }
              options={["Browser Downloads", "Ask every time", "Server temp package"]}
            />

            <SelectField
              label="Filename pattern"
              value={single.filenamePattern}
              onChange={(filenamePattern) =>
                setSingle((previous) => ({ ...previous, filenamePattern }))
              }
              options={["Title", "Channel - Title", "Date - Title"]}
            />
          </div>
        </Section>

        <Section
          title="Download preview / Kakunin"
          subtitle="Frontend-only command preview."
          icon={Download}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-kaijuu-border bg-kaijuu-bg p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-kaijuu-muted">
                File name
              </div>

              <div className="mt-2 break-words text-sm font-semibold text-kaijuu-text">
                {state.filename}
              </div>
            </div>

            <pre className="overflow-x-auto rounded-xl border border-kaijuu-border bg-black/60 p-4 text-xs leading-6 text-cyan-100">
              {commandPreview}
            </pre>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-kaijuu-green/60 bg-kaijuu-green px-5 py-4 text-sm font-bold text-black shadow-xl shadow-kaijuu-green/10 transition hover:-translate-y-0.5">
              <Download className="h-4 w-4" />
              Mock browser download / Karitori
            </button>

            <p className="text-xs leading-5 text-kaijuu-muted">
              Real download behavior will require a backend job, a generated file
              stream, and a Content-Disposition filename header.
            </p>
          </div>
        </Section>
      </div>
    </motion.main>
  );
}

function PlaylistScreen({
  state,
  onBack
}: {
  state: AppState;
  onBack: () => void;
}) {
  const [playlist, setPlaylist] = useState<Record<string, boolean>>({
    fullPlaylist: true,
    playlistRange: false,
    currentVideoOnly: false,
    splitChapters: false,
    selectedChapter: false,
    mergeAv: true,
    remux: true,
    embedThumbnail: true,
    embedMetadata: true,
    keepOriginal: false,
    overwriteExisting: false
  });

  const rows = [
    ["fullPlaylist", "Download full playlist", "Batch the complete playlist into a queue."],
    ["playlistRange", "Download playlist range", "Limit the queue to a start and end index."],
    ["currentVideoOnly", "Download only current video", "Ignore playlist entries and use the active video."],
    ["splitChapters", "Split by chapters", "Create separate files for chapters when available."],
    ["selectedChapter", "Download selected chapter", "Use a chosen chapter as the output range."],
    ["mergeAv", "Merge video + audio", "Combine best video and audio streams."],
    ["remux", "Remux to mp4/webm/mkv", "Change container without full re-encoding when possible."],
    ["embedThumbnail", "Embed thumbnail", "Attach the video thumbnail to the output file."],
    ["embedMetadata", "Embed metadata", "Preserve title, uploader, date, and related metadata."],
    ["keepOriginal", "Keep original file after conversion", "Useful for debugging conversion or preserving source outputs."],
    ["overwriteExisting", "Overwrite / skip existing files", "Control duplicate handling for repeated downloads."]
  ];

  return (
    <motion.main
      key="playlist"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl px-5 pb-12"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Pill active icon={ListVideo}>
            Playlist / Ichiran
          </Pill>

          <h2 className="mt-3 text-2xl font-bold text-kaijuu-text">
            Configure playlist behavior
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-kaijuu-muted">
            The app detected a playlist parameter, so it switches into playlist-first controls.
          </p>
        </div>

        <button
          onClick={onBack}
          className="rounded-xl border border-kaijuu-border px-4 py-2 text-sm text-kaijuu-muted transition hover:border-kaijuu-cyan hover:text-kaijuu-cyan"
        >
          Back / Modoru
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Playlist options / Ichiran Sentaku"
          subtitle="Options mirror the future yt-dlp backend intent model."
          icon={ListVideo}
        >
          <div className="grid gap-3">
            {rows.map(([key, title, subtitle]) => (
              <ToggleRow
                key={key}
                title={title}
                subtitle={subtitle}
                checked={playlist[key]}
                onChange={(value) =>
                  setPlaylist((previous) => ({
                    ...previous,
                    [key]: value
                  }))
                }
              />
            ))}
          </div>
        </Section>

        <Section
          title="Queue preview / Junban"
          subtitle="Mock representation of what the backend will package for browser download."
          icon={FolderDown}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-kaijuu-border bg-kaijuu-bg p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-kaijuu-muted">
                Playlist source
              </div>

              <div className="mt-2 break-words text-sm text-kaijuu-text">
                {state.url}
              </div>
            </div>

            <div className="grid gap-3">
              {["Entry 01", "Entry 02", "Entry 03"].map((entry, index) => (
                <div
                  key={entry}
                  className="flex items-center justify-between rounded-xl border border-kaijuu-border bg-kaijuu-bg/70 p-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-kaijuu-text">
                      {entry}
                    </div>

                    <div className="mt-1 text-xs text-kaijuu-muted">
                      {state.filename} - Part {index + 1}
                    </div>
                  </div>

                  {index === 0 ? (
                    <FileVideo className="h-5 w-5 text-kaijuu-cyan" />
                  ) : (
                    <FileAudio className="h-5 w-5 text-kaijuu-muted" />
                  )}
                </div>
              ))}
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-kaijuu-green/60 bg-kaijuu-green px-5 py-4 text-sm font-bold text-black shadow-xl shadow-kaijuu-green/10 transition hover:-translate-y-0.5">
              <Download className="h-4 w-4" />
              Mock package download / Karitori
            </button>

            <p className="text-xs leading-5 text-kaijuu-muted">
              For playlists, the backend should usually stream a zip package or
              provide per-file downloads after processing.
            </p>
          </div>
        </Section>
      </div>
    </motion.main>
  );
}

export default function Page() {
  const [step, setStep] = useState<Step>("intake");

  const [state, setState] = useState<AppState>({
    url: "",
    videoId: "",
    originalTitle: "",
    filename: "",
    sourceType: "single"
  });

  function initiate() {
    setStep(state.sourceType === "playlist" ? "playlist" : "single");
  }

  return (
    <div
      className="min-h-screen overflow-hidden text-kaijuu-text"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(24,240,200,0.16), transparent 34%), radial-gradient(circle at top right, rgba(255,61,129,0.13), transparent 30%), #05070A"
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#EAF7F4 1px, transparent 1px), linear-gradient(90deg, #EAF7F4 1px, transparent 1px)",
          backgroundSize: "34px 34px"
        }}
      />

      <div className="relative z-10">
        <AppHeader />

        <AnimatePresence mode="wait">
          {step === "intake" ? (
            <IntakeScreen
              state={state}
              setState={setState}
              onInitiate={initiate}
            />
          ) : step === "playlist" ? (
            <PlaylistScreen state={state} onBack={() => setStep("intake")} />
          ) : (
            <SingleVideoScreen state={state} onBack={() => setStep("intake")} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}