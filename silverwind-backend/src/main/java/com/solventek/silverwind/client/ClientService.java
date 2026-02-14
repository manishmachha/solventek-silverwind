package com.solventek.silverwind.client;

import com.solventek.silverwind.dto.ClientDTO;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.security.UserPrincipal;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.timeline.TimelineService;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ClientService {

    private final ClientRepository clientRepository;
    private final NotificationService notificationService;
    private final TimelineService timelineService;
    private final EmployeeRepository employeeRepository;

    public List<ClientDTO> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ClientDTO getClientById(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Client not found with id: " + id));
        return mapToDTO(client);
    }

    public ClientDTO createClient(ClientDTO clientDTO) {
        Client client = mapToEntity(clientDTO);
        Client savedClient = clientRepository.save(client);

        UUID currentUserId = getCurrentUserId();
        UUID orgId = getCurrentUserOrgId(currentUserId);

        // Timeline
        if (orgId != null) {
            timelineService.createEvent(orgId, "CLIENT", savedClient.getId(), "CREATE",
                    "Client Created", currentUserId, "Client created: " + savedClient.getName(), null);

            // Notification
            try {
                employeeRepository.findByOrganizationId(orgId).forEach(admin -> {
                    notificationService.sendNotification(
                            NotificationService.NotificationBuilder.create()
                                    .recipient(admin.getId())
                                    .title("New Client Added")
                                    .body("Client " + savedClient.getName() + " has been added.")
                                    .category(NotificationCategory.CLIENT)
                                    // I should check if I need CLIENT category.
                                    // Notification.java didn't have CLIENT. I'll
                                    // stick to SYSTEM or maybe ORGANIZATION?
                                    // Let's use SYSTEM for now or add CLIENT to
                                    // enum if strictly needed. Actually I just
                                    // added CANDIDATE. I should probably add
                                    // CLIENT too if I want to be consistent. But
                                    // for now SYSTEM is safe.
                                    .priority(NotificationPriority.NORMAL)
                                    .actionUrl("/clients/" + client.getId())
                                    .icon("bi-building"));
                });
            } catch (Exception e) {
                log.error("Failed to send client creation notification", e);
            }
        }

        return mapToDTO(client);
    }

    public ClientDTO updateClient(UUID id, ClientDTO clientDTO) {
        Client existingClient = clientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Client not found with id: " + id));

        existingClient.setName(clientDTO.getName());
        existingClient.setEmail(clientDTO.getEmail());
        existingClient.setPhone(clientDTO.getPhone());
        existingClient.setCity(clientDTO.getCity());
        existingClient.setCountry(clientDTO.getCountry());
        existingClient.setWebsite(clientDTO.getWebsite());
        existingClient.setLogoUrl(clientDTO.getLogoUrl());
        existingClient.setDescription(clientDTO.getDescription());
        existingClient.setIndustry(clientDTO.getIndustry());
        existingClient.setAddress(clientDTO.getAddress());

        existingClient = clientRepository.save(existingClient);

        UUID currentUserId = getCurrentUserId();
        UUID orgId = getCurrentUserOrgId(currentUserId);

        if (orgId != null) {
            timelineService.createEvent(orgId, "CLIENT", existingClient.getId(), "UPDATE",
                    "Client Updated", currentUserId, "Client details updated", null);
        }

        return mapToDTO(existingClient);
    }

    public void deleteClient(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Client not found with id: " + id));

        String clientName = client.getName();
        clientRepository.deleteById(id);

        UUID currentUserId = getCurrentUserId();
        UUID orgId = getCurrentUserOrgId(currentUserId);

        if (orgId != null) {
            timelineService.createEvent(orgId, "CLIENT", id, "DELETE",
                    "Client Deleted", currentUserId, "Client deleted: " + clientName, null);
        }
    }

    private ClientDTO mapToDTO(Client client) {
        return ClientDTO.builder()
                .id(client.getId())
                .name(client.getName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .city(client.getCity())
                .country(client.getCountry())
                .website(client.getWebsite())
                .logoUrl(client.getLogoUrl())
                .description(client.getDescription())
                .industry(client.getIndustry())
                .address(client.getAddress())
                .build();
    }

    private Client mapToEntity(ClientDTO dto) {
        return Client.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .city(dto.getCity())
                .country(dto.getCountry())
                .website(dto.getWebsite())
                .logoUrl(dto.getLogoUrl())
                .description(dto.getDescription())
                .industry(dto.getIndustry())
                .address(dto.getAddress())
                .build();
    }

    private UUID getCurrentUserId() {
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getId();
        }
        return null;
    }

    private UUID getCurrentUserOrgId(UUID userId) {
        if (userId == null)
            return null;
        return employeeRepository.findById(userId)
                .map(e -> e.getOrganization().getId())
                .orElse(null);
    }
}
