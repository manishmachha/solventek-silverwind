// Jenkinsfile for Silverwind CI/CD Pipeline
// Builds, tests, and deploys both frontend and backend

pipeline {
    agent any

    environment {
        // Docker Registry (use ECR or Docker Hub)
        DOCKER_REGISTRY = credentials('docker-registry-url')
                
        // AWS Credentials
        AWS_CREDENTIALS = credentials('aws-credentials')
        AWS_REGION = 'eu-north-1'
        
        // EC2 Deployment
        EC2_HOST = credentials('ec2-host')
        EC2_USER = 'ec2-user'
        EC2_KEY = credentials('ec2-ssh-key')
        
        // Image tags
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                }
                echo "Building branch: ${env.GIT_BRANCH}, commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Build Backend') {
            steps {
                dir('silverwind-backend') {
                    sh '''
                        chmod +x mvnw
                        ./mvnw clean package -DskipTests -B
                    '''
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'silverwind-backend/target/*.jar', fingerprint: true
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('silverwind-frontend') {
                    sh '''
                        npm ci --legacy-peer-deps
                        npm run build
                    '''
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'silverwind-frontend/dist/**/*', fingerprint: true
                }
            }
        }

        stage('Docker Build') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('silverwind-backend') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/silverwind-backend:${IMAGE_TAG} .
                                docker tag ${DOCKER_REGISTRY}/silverwind-backend:${IMAGE_TAG} ${DOCKER_REGISTRY}/silverwind-backend:latest
                            """
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('silverwind-frontend') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/silverwind-frontend:${IMAGE_TAG} .
                                docker tag ${DOCKER_REGISTRY}/silverwind-frontend:${IMAGE_TAG} ${DOCKER_REGISTRY}/silverwind-frontend:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Docker Push') {
    steps {
        script {
            sh """
                aws ecr get-login-password --region ${AWS_REGION} \
                | docker login --username AWS --password-stdin ${DOCKER_REGISTRY}

                docker push ${DOCKER_REGISTRY}/silverwind-backend:${IMAGE_TAG}
                docker push ${DOCKER_REGISTRY}/silverwind-backend:latest
                docker push ${DOCKER_REGISTRY}/silverwind-frontend:${IMAGE_TAG}
                docker push ${DOCKER_REGISTRY}/silverwind-frontend:latest
            """
        }
    }
}

        stage('Deploy to EC2') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                script {
                    // Copy docker-compose and deploy script to EC2
                    sh """
                        scp -i ${EC2_KEY} -o StrictHostKeyChecking=no \
                            docker-compose.prod.yml \
                            ${EC2_USER}@${EC2_HOST}:/home/${EC2_USER}/silverwind/
                        
                        scp -i ${EC2_KEY} -o StrictHostKeyChecking=no \
                            scripts/deploy.sh \
                            ${EC2_USER}@${EC2_HOST}:/home/${EC2_USER}/silverwind/
                    """
                    
                    // Execute deployment
                    sh """
                        ssh -i ${EC2_KEY} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} \
                            'cd /home/${EC2_USER}/silverwind && \
                             export DOCKER_REGISTRY=${DOCKER_REGISTRY} && \
                             export IMAGE_TAG=${IMAGE_TAG} && \
                             chmod +x deploy.sh && \
                             ./deploy.sh'
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
            // Optionally send Slack/email notification
            // slackSend(color: 'good', message: "Build ${env.BUILD_NUMBER} succeeded")
        }
        failure {
            echo "Pipeline failed!"
            // slackSend(color: 'danger', message: "Build ${env.BUILD_NUMBER} failed")
        }
        always {
            // Clean up Docker images to save space
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}
