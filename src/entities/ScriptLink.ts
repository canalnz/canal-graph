import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import Bot from './Bot';
import {Script} from './Script';
import User from './User';
import {gateway} from '../gateway/connector';

@Entity('script_links')
export class ScriptLink {
  @ManyToOne((type) => Bot, bot => bot.scripts, {lazy: true, primary: true})
  @JoinColumn({name: 'bot_id'})
  public bot!: Promise<Bot>;

  @PrimaryColumn({name: 'bot_id', type: 'bigint'})
  public botId!: string;

  @ManyToOne((type) => Script, {lazy: true, primary: true})
  @JoinColumn({name: 'script_id'})
  public script!: Promise<Script>;

  @PrimaryColumn({name: 'script_id', type: 'bigint'})
  public scriptId!: string;

  @Column({name: 'last_started', type: 'timestamp', nullable: true})
  public lastStarted!: Date | null;

  @CreateDateColumn()
  public created!: Date;

  @ManyToOne((type) => User, {lazy: true, nullable: true})
  @JoinColumn({name: 'created_by'})
  public createdBy!: Promise<string | null>;

  @Column({name: 'created_by', nullable: true, type: 'bigint'})
  public createdById!: string | null;
}
