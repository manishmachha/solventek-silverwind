package com.solventek.silverwind.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aws.s3")
@Data
public class AwsProperties {
    private boolean enabled;
    private String bucketName;
    private String region;
    private String accessKey;
    private String secretKey;
    private int presignedUrlExpirationMinutes = 60;
}
