import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import User from './User';
import {ScriptLink} from './ScriptLink';

export type Platform = 'NODEJS';
export const platforms = ['NODEJS'];

@Entity('bots')
export default class Bot {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column({length : 128})
  public name!: string;

  @Column({length: 4})
  public discriminator!: string;

  @Column({
    name: 'discord_id',
    type: 'bigint'
  })
  public discordId!: string;

  @Column({length: 64})
  public token!: string;

  @Column({
    name: 'avatar_hash',
    type: 'varchar',
    length: 64,
    nullable: true
  })
  public avatarHash!: string | null;

  @Column({
    type: 'enum',
    enum: platforms
  })
  public platform!: Platform;

  @Column({
    name: 'api_key',
    length: 64
  })
  public apiKey!: string;

  @ManyToOne((type) => User, (user) => user.bots, {lazy: true})
  @JoinColumn({name: 'resource_owner'})
  public resourceOwner!: Promise<User>;

  @Column({name: 'resource_owner', type: 'bigint'})
  public resourceOwnerId!: string;

  @CreateDateColumn()
  public created!: string;

  @ManyToOne(type => User, {lazy: true, nullable: true})
  @JoinColumn({name: 'created_by'})
  public createdBy!: Promise<string | null>;

  @Column({name: 'created_by', type: 'bigint', nullable: true})
  public createdById!: string | null;

  @UpdateDateColumn({
    nullable: true
  })
  public updated!: Date | null;

  @ManyToOne(type => User, {lazy: true, nullable: true})
  @JoinColumn({name: 'updated_by'})
  public updatedBy!: Promise<string | null>;

  @Column({name: 'updated_by', type: 'bigint', nullable: true})
  public updatedById!: string | null;

  @OneToMany((type) => ScriptLink, (link) => link.bot, {lazy: true})
  public scripts!: Promise<ScriptLink[]>;
}
