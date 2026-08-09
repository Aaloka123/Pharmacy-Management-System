import ProductShowcaseSection from './ProductShowcaseSection'

const TopProduct = () => (
  <ProductShowcaseSection rotateIntervalMs={10_000} sort="topStock" title="Top Medicines" />
)

export default TopProduct
