package com.grocery.management.config;

import com.grocery.management.dto.AuthenticatedUserProfile;
import com.grocery.management.service.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class KeycloakOrderAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AuthServiceClient authServiceClient;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        AuthenticatedUserProfile profile = authServiceClient.getCurrentUser("Bearer " + jwt.getTokenValue());
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        if (profile.getRole() != null && !profile.getRole().isBlank()) {
            authorities.add(new SimpleGrantedAuthority(profile.getRole()));
        }
        return new UsernamePasswordAuthenticationToken(profile, jwt.getTokenValue(), authorities);
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
            roles.stream()
                    .map(Object::toString)
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        }
        return authorities;
    }
}
