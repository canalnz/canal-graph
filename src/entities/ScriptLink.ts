import {Column, CreateDateColumn, Entity, PrimaryColumn} from 'typeorm';

@Entity('script_links')
export class ScriptLink {
  @PrimaryColumn({
    name: 'bot_id',
    type: 'bigint'
  })
  public botId!: string;

  @PrimaryColumn({
    name: 'script_id',
    type: 'bigint'
  })
  public scriptId!: string;

  @Column({
    name: 'last_started',
    type: 'timestamp',
    nullable: true
  })
  public lastStarted!: Date | null;

  @CreateDateColumn()
  public created!: Date;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true
  })
  public createdBy!: string | null;
}
