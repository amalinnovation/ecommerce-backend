import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { SearchProductsUseCase } from '../../application/use-cases/search-products.use-case';
import { GetRecommendationsUseCase } from '../../application/use-cases/get-recommendations.use-case';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import type { CategoryNodeDto } from './dto/category-node.dto';
import type { PagedProductsDto, RecommendedProductDto, SearchResultDto } from './dto/product-summary.dto';
import type { ProductDetailDto } from './dto/product-detail.dto';

@ApiTags('catalog')
@Controller('v1/catalog')
export class CatalogController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductBySlug: GetProductBySlugUseCase,
    private readonly searchProducts: SearchProductsUseCase,
    private readonly getRecommendations: GetRecommendationsUseCase,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Árbol de categorías de 2 niveles' })
  async categories(): Promise<CategoryNodeDto[]> {
    return this.listCategories.execute();
  }

  @Get('products')
  @ApiOperation({ summary: 'Listado de productos activos, con cursor y filtros' })
  async products(@Query() query: ListProductsQueryDto): Promise<PagedProductsDto> {
    const page = await this.listProducts.execute({
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      cursor: query.cursor,
      limit: query.limit,
    });
    return {
      items: page.items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        categoryId: item.categoryId,
        isFeatured: item.isFeatured,
        fromPrice: item.fromPrice,
      })),
      nextCursor: page.nextCursor,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Búsqueda de texto completo, ordenada por relevancia (ts_rank)' })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto[]> {
    const results = await this.searchProducts.execute(query.q, query.limit);
    return results.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      fromPrice: item.fromPrice,
      rank: item.rank,
    }));
  }

  @Get('products/:id/recommendations')
  @ApiOperation({ summary: 'Productos relacionados (misma categoría, por popularidad)' })
  async recommendations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ): Promise<RecommendedProductDto[]> {
    const products = await this.getRecommendations.execute(id, limit);
    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
    }));
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Ficha de un producto con sus variantes y precio vigente' })
  async productBySlug(@Param('slug') slug: string): Promise<ProductDetailDto> {
    const { product, variants } = await this.getProductBySlug.execute(slug);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      variants: variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        attributes: variant.attributes,
        stock: variant.stock,
        price: variant.price
          ? {
              amount: variant.price.amount,
              offerAmount: variant.price.offerAmount,
              available: variant.price.available,
            }
          : null,
      })),
    };
  }
}
