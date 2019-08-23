import {Column, CreateDateColumn, Entity, PrimaryColumn} from 'typeorm';

@Entity()
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
  public added!: Date;

  @Column({
    name: 'added_by',
    type: 'bigint',
    nullable: true
  })
  public addedBy!: string | null;
}
