package com.mednexus.mednexus.order;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorOrderRepository extends JpaRepository<VendorOrder, Long> {

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			WHERE o.vendor.id = :vendorId
			ORDER BY o.createdAt DESC
			""")
	List<VendorOrder> findByVendorIdWithDetails(@Param("vendorId") Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.vendor
			WHERE o.user.id = :userId
			ORDER BY o.createdAt DESC
			""")
	List<VendorOrder> findByUserIdWithDetails(@Param("userId") Long userId);

	Optional<VendorOrder> findByIdAndVendorId(Long id, Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			JOIN FETCH o.vendor
			WHERE o.id = :orderId AND o.vendor.id = :vendorId
			""")
	Optional<VendorOrder> findByIdAndVendorIdWithDetails(
			@Param("orderId") Long orderId,
			@Param("vendorId") Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			WHERE o.id = :orderId AND o.user.id = :userId
			""")
	Optional<VendorOrder> findByIdAndUserIdWithDetails(
			@Param("orderId") Long orderId,
			@Param("userId") Long userId);

	boolean existsByUserIdAndProductIdAndStatusIn(
			Long userId,
			Long productId,
			Collection<OrderStatus> statuses);

	Optional<VendorOrder> findFirstByUserIdAndProductIdAndStatusInOrderByCreatedAtDesc(
			Long userId,
			Long productId,
			Collection<OrderStatus> statuses);

	long countByStatusNot(OrderStatus status);

	long countByCreatedAtGreaterThanEqual(Instant createdAt);

	long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

	@Query(value = """
			SELECT COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE o.status <> 'CANCELED'
			""", nativeQuery = true)
	java.math.BigDecimal sumPlatformRevenue();

	@Query(value = """
			SELECT COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE o.status <> 'CANCELED'
			AND o.created_at >= :start AND o.created_at < :end
			""", nativeQuery = true)
	java.math.BigDecimal sumPlatformRevenueBetween(
			@Param("start") Instant start,
			@Param("end") Instant end);

	@Query(value = """
			SELECT MONTH(o.created_at), COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE YEAR(o.created_at) = :year AND o.status <> 'CANCELED'
			GROUP BY MONTH(o.created_at)
			ORDER BY MONTH(o.created_at)
			""", nativeQuery = true)
	List<Object[]> sumRevenueGroupedByMonth(@Param("year") int year);

	@Query(value = """
			SELECT YEAR(o.created_at), MONTH(o.created_at), COUNT(o.id)
			FROM vendor_order o
			WHERE o.created_at >= :since
			GROUP BY YEAR(o.created_at), MONTH(o.created_at)
			ORDER BY YEAR(o.created_at), MONTH(o.created_at)
			""", nativeQuery = true)
	List<Object[]> countOrdersGroupedByMonth(@Param("since") Instant since);

	@Query(value = """
			SELECT o.vendor_id, v.business_name, COUNT(o.id), COALESCE(SUM(o.unit_price * o.quantity), 0), v.profile_image
			FROM vendor_order o
			INNER JOIN vendor v ON v.id = o.vendor_id
			WHERE o.status <> 'CANCELED'
			GROUP BY o.vendor_id, v.business_name, v.profile_image
			ORDER BY SUM(o.unit_price * o.quantity) DESC
			""", nativeQuery = true)
	List<Object[]> findTopVendorsByRevenue(Pageable pageable);

	List<VendorOrder> findTop10ByOrderByCreatedAtDesc();

	long countByVendorIdAndStatusNot(Long vendorId, OrderStatus status);

	long countByVendorIdAndCreatedAtGreaterThanEqual(Long vendorId, Instant createdAt);

	long countByVendorIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
			Long vendorId,
			Instant start,
			Instant end);

	@Query(value = """
			SELECT COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId AND o.status <> 'CANCELED'
			""", nativeQuery = true)
	java.math.BigDecimal sumRevenueByVendor(@Param("vendorId") Long vendorId);

	@Query(value = """
			SELECT COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId
			AND o.status <> 'CANCELED'
			AND o.created_at >= :start AND o.created_at < :end
			""", nativeQuery = true)
	java.math.BigDecimal sumRevenueByVendorBetween(
			@Param("vendorId") Long vendorId,
			@Param("start") Instant start,
			@Param("end") Instant end);

	@Query(value = """
			SELECT MONTH(o.created_at), COALESCE(SUM(o.unit_price * o.quantity), 0)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId
			AND YEAR(o.created_at) = :year AND o.status <> 'CANCELED'
			GROUP BY MONTH(o.created_at)
			ORDER BY MONTH(o.created_at)
			""", nativeQuery = true)
	List<Object[]> sumRevenueGroupedByMonthForVendor(
			@Param("vendorId") Long vendorId,
			@Param("year") int year);

	@Query(value = """
			SELECT o.status, COUNT(o.id)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId
			GROUP BY o.status
			""", nativeQuery = true)
	List<Object[]> countOrdersByStatusForVendor(@Param("vendorId") Long vendorId);

	@Query(value = """
			SELECT o.payment_method, COUNT(o.id)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId AND o.status <> 'CANCELED'
			GROUP BY o.payment_method
			""", nativeQuery = true)
	List<Object[]> countOrdersByPaymentMethodForVendor(@Param("vendorId") Long vendorId);

	@Query(value = """
			SELECT DATE(o.created_at), COUNT(o.id)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId AND o.created_at >= :since
			GROUP BY DATE(o.created_at)
			ORDER BY DATE(o.created_at)
			""", nativeQuery = true)
	List<Object[]> countOrdersGroupedByDayForVendor(
			@Param("vendorId") Long vendorId,
			@Param("since") Instant since);

	@Query(value = """
			SELECT o.product_id, o.product_name, COALESCE(SUM(o.quantity), 0),
			       COALESCE(SUM(o.unit_price * o.quantity), 0), MAX(o.product_image)
			FROM vendor_order o
			WHERE o.vendor_id = :vendorId AND o.status <> 'CANCELED'
			GROUP BY o.product_id, o.product_name
			ORDER BY SUM(o.quantity) DESC
			""", nativeQuery = true)
	List<Object[]> findTopProductsByVendor(
			@Param("vendorId") Long vendorId,
			Pageable pageable);

	@Query(value = """
			SELECT o.product_id, o.product_name, MAX(o.product_sku),
			       o.vendor_id, v.business_name, MAX(o.product_image),
			       MAX(o.unit_price),
			       COALESCE(SUM(o.quantity), 0),
			       COALESCE(SUM(o.unit_price * o.quantity), 0),
			       MIN(o.created_at)
			FROM vendor_order o
			INNER JOIN vendor v ON v.id = o.vendor_id
			WHERE o.status <> 'CANCELED'
			  AND o.created_at >= :start
			  AND o.created_at < :end
			GROUP BY o.product_id, o.product_name, o.vendor_id, v.business_name
			ORDER BY MAX(o.created_at) DESC
			""", nativeQuery = true)
	List<Object[]> findProductProfitSummaryBetween(
			@Param("start") Instant start,
			@Param("end") Instant end);

	@Query(value = """
			SELECT o.product_id, o.product_name, MAX(o.product_sku),
			       o.vendor_id, v.business_name, MAX(o.product_image),
			       MAX(o.unit_price),
			       COALESCE(SUM(o.quantity), 0),
			       COALESCE(SUM(o.unit_price * o.quantity), 0),
			       MIN(o.created_at)
			FROM vendor_order o
			INNER JOIN vendor v ON v.id = o.vendor_id
			WHERE o.status <> 'CANCELED'
			GROUP BY o.product_id, o.product_name, o.vendor_id, v.business_name
			ORDER BY MAX(o.created_at) DESC
			""", nativeQuery = true)
	List<Object[]> findProductProfitSummaryAll();

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			JOIN FETCH o.vendor
			WHERE o.vendor.id = :vendorId
			ORDER BY o.createdAt DESC
			""")
	List<VendorOrder> findRecentByVendorId(@Param("vendorId") Long vendorId, Pageable pageable);
}
