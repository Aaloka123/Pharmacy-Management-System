package com.mednexus.mednexus.prescription;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

	List<Prescription> findByUser_IdOrderByCreatedAtDesc(Long userId);

	Optional<Prescription> findByIdAndUser_Id(Long id, Long userId);
}
