export interface Language {
    type: "standard" | "exotic";
    script: string | null;
    speakers: string;
}
