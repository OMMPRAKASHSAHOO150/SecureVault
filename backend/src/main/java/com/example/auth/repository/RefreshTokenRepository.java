package com.example.auth.repository;

import com.example.auth.entity.RefreshToken;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByToken(String token);

    /**
     * Bulk-delete by ID. Unlike delete(entity), this JPQL DELETE does NOT
     * assert a row count, so it is safe to call even if the row was already
     * removed by a concurrent request (prevents StaleObjectStateException).
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.id = :id")
    void deleteByIdSafe(@Param("id") Long id);
}
