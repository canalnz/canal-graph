import {Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn} from 'typeorm';

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

  // @ManyToOne(type => User)
  @Column({
    name: 'resource_owner',
    type: 'bigint'
  })
  public resourceOwner!: string;

  @CreateDateColumn()
  public created!: string;

  // @ManyToOne(type => User)
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

  // @ManyToOne(type => User)
  @Column({
    name: 'updated_by',
    type: 'bigint',
    nullable: true
  })
  public updatedBy!: string | null;
}
