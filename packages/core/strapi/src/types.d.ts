declare module '@strapi/generators' {
  export interface GeneratorOptions {
    [key: string]: any;
  }
  
  export function generate(options: GeneratorOptions): Promise<void>;
  export function runCLI(): Promise<void>;

  const generators: {
    generate: typeof generate;
    runCLI: typeof runCLI;
  };
  
  export default generators;
}

declare module '@strapi/cloud-cli' {
  import { Command } from 'commander';

  export interface CloudCommand {
    command: string;
    description: string;
    lifecycles?: any;
    options?: any;
  }

  export type StrapiCommandReturn = void | Command | Promise<void | Command>;
  export type StrapiCommand = StrapiCommandReturn | (() => StrapiCommandReturn);

  export function buildStrapiCloudCommands(): StrapiCommandReturn;
} 