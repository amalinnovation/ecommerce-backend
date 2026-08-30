import { IsInt, Max, Min } from 'class-validator';

/** Sin price/total, igual que AddCartItemDto. */
export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}
