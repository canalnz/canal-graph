import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from 'typeorm';
import {Platform, platforms} from './Bot';

export type ScriptState = 'RUNNING' | 'PASSIVE' | 'ERRORED' | 'STOPPED';

@Entity('scripts')
export class Script {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public body!: string;

  @Column({
    type: 'enum',
    enum: platforms
  })
  public platform!: Platform;

  @Column({
    name: 'resource_owner',
    type: 'bigint'
  })
  public resourceOwner!: string;

  @CreateDateColumn()
  public created!: string;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true
  })
  public createdBy!: string | null;

  @UpdateDateColumn({
    nullable: true
  })
  public updated!: Date | null;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    nullable: true
  })
  public updatedBy!: string;
}
