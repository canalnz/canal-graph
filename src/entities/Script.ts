import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn} from 'typeorm';
import {Platform, platforms} from './Bot';
import User from './User';

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

  @ManyToOne((type) => User, (user) => user.scripts, {lazy: true})
  @JoinColumn({name: 'resource_owner'})
  public resourceOwner!: Promise<User>;

  @Column({
    name: 'resource_owner',
    type: 'bigint'
  })
  public resourceOwnerId!: string;

  @CreateDateColumn()
  public created!: string;

  @ManyToOne((type) => User, {lazy: true, nullable: true})
  @JoinColumn({name: 'created_by'})
  public createdBy!: Promise<User | null>;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true
  })
  public createdById!: string | null;

  @UpdateDateColumn({
    nullable: true
  })
  public updated!: Date | null;

  @ManyToOne((type) => User, {lazy: true, nullable: true})
  @JoinColumn({name: 'updated_by'})
  public updatedBy!: Promise<User | null>;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    nullable: true
  })
  public updatedById!: string | null;
}
