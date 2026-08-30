import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentVisitorId } from '../../../identity';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { UpdateCartItemUseCase } from '../../application/use-cases/update-cart-item.use-case';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import type { CartSnapshot } from '../../application/services/build-cart-snapshot.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import type { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('cart')
@Controller('v1/cart')
export class CartController {
  constructor(
    private readonly getCart: GetCartUseCase,
    private readonly addCartItem: AddCartItemUseCase,
    private readonly updateCartItem: UpdateCartItemUseCase,
    private readonly removeCartItem: RemoveCartItemUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'El carrito completo del visitante actual' })
  async get(@CurrentVisitorId() visitorId: string): Promise<CartResponseDto> {
    return toDto(await this.getCart.execute(visitorId));
  }

  @Post('items')
  @ApiOperation({ summary: 'Agrega una línea. Nunca recibe precio: se recalcula server-side.' })
  async add(@CurrentVisitorId() visitorId: string, @Body() dto: AddCartItemDto): Promise<CartResponseDto> {
    return toDto(await this.addCartItem.execute(visitorId, dto.variantId, dto.quantity));
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Reemplaza la cantidad de una línea' })
  async update(
    @CurrentVisitorId() visitorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return toDto(await this.updateCartItem.execute(visitorId, id, dto.quantity));
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Quita una línea del carrito' })
  async remove(
    @CurrentVisitorId() visitorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartResponseDto> {
    return toDto(await this.removeCartItem.execute(visitorId, id));
  }
}

function toDto(snapshot: CartSnapshot): CartResponseDto {
  return {
    cartId: snapshot.cartId,
    status: snapshot.status,
    subtotal: snapshot.subtotal,
    items: snapshot.lines.map((line) => ({
      cartItemId: line.cartItemId,
      variantId: line.variantId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      priceUnavailable: line.priceUnavailable,
    })),
  };
}
