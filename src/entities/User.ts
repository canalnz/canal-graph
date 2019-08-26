import {Column, CreateDateColumn, Entity, PrimaryColumn} from 'typeorm';

@Entity('users')
export default class User {
  @PrimaryColumn('bigint')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public email!: string;

  @Column()
  public verified!: boolean;

  @Column({
    name: 'avatar_hash',
    type: 'varchar',
    nullable: true
  })
  public avatarHash!: string | null;

  @CreateDateColumn()
  public created!: Date;

  @Column({
    name: 'last_login',
    type: 'timestamp',
    nullable: true
  })
  public lastLogin!: Date | null;
}
