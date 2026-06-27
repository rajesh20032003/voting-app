pipeline {
  agent any 
  environment {
    REGISTRY = 'rajesh00007'
    SCANNER_HOME = tool 'SonarScanner'
    
  }
  stages {
    stage('checkout-scm') {
      steps {
         cleanWs()
         checkout scm  
         echo "checking out rthe code from last commit : ${env.GIT_COMMIT}"
      }
    }
  
  stage('gitleaks-secret-scan') {
    steps {
      sh '''
      gitleaks detect --source . --verbose --report-path=gitleaks-report.json
      '''
    }
    post {
      always {
        archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
      }
    }
  }
  stage('trivy fs scan') {
    steps {
      sh """
      trivy fs --scanners vuln,secret,misconfig .
      """
    }
  }
  stage('quality-check') {
    agent {
      docker { 
        image 'node:24.17.0-alpine3.24'
        args '--network devops-network -v $HOME/.npm:/root/.npm'
        }

    }
    //export NPM_CONFIG_REGISTRY=http://nexus:8081/repository/npm-proxy-1/
    steps {
      dir('backend') {
        sh '''
        
        npm ci --no-audit 
        npm run test:ci
        
      
        '''
      }
    }
    post {
      always {
        stash(
          name: 'backend-test-results',
          includes: '''
          backend/coverage/**,
          backend/reports/**,
          backend/package.json,
          backend/package-lock.json,
          backend/index.js,
          backend/index.test.js
          '''
        )
        archiveArtifacts artifacts: '''
backend/coverage/lcov.info,
backend/reports/junit.xml
''', allowEmptyArchive: true
      }
    }
  }
  stage('debug') {
    steps {
        script {
            echo "before"

            withSonarQubeEnv('SonarQube') {
                echo "inside"

                sh """
                echo hello
                env | sort
                """
            }

            echo "after"
        }
    }
}
  stage('sonarqube analysis') {
  steps {
   
   unstash 'backend-test-results'

    dir('backend') {
       sh '''
            pwd
            ls -lah
            ls -lah coverage
            ls -lah reports
            which sonar-scanner
            sonar-scanner --version
            '''
      withSonarQubeEnv('SonarQube') {
        sh """
        sonar-scanner \
        -Dsonar.projectKey=voting-app \
        -Dsonar.projectName=voting-app \
        -Dsonar.projectVersion=${BUILD_NUMBER} \
        -Dsonar.sources=. \
        -Dsonar.tests=. \
        -Dsonar.test.inclusions=**/*.test.js \
        -Dsonar.exclusions=node_modules/**,coverage/** \
        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
        -Dsonar.junit.reportPaths=reports/junit.xml
        """
      }
    }
  }
  }

  stage('quality-gate-sonarqube') {
    steps {
      timeout( time: 5, unit: 'MINUTES') {
        waitForQualityGate abortPipeline: true
      }
    }
  }
  stage('image building'){
    parallel {
      stage('frontend-building') {
        steps {
          dir('frontend') {
            withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
           sh '''
           BUILDER=frontend-${BUILD_NUMBER}
           SERVICE=frontend

           echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
           docker buildx create --name "$BUILDER" --driver docker-container --use

           docker buildx build \
           --builder "$BUILDER" \
           --platform linux/amd64 \
           --tag ${REGISTRY}/$SERVICE:${BUILD_NUMBER} \
           --cache-to type=registry,ref=$REGISTRY/$SERVICE:buildcache,mode=max \
           --cache-from type=registry,ref=$REGISTRY/$SERVICE:buildcache \
           --push \
           .

          docker buildx rm "$BUILDER"
          
            '''
            }
          }
        }
      }
      stage('backend-building') {
        steps {
          dir('backend') {
            withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
           sh '''
           BUILDER=backend-${BUILD_NUMBER}
           SERVICE=backend
           
           echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
           docker buildx create --name "$BUILDER" --driver docker-container --use

           docker buildx build \
           --builder "$BUILDER" \
           --platform linux/amd64 \
           --tag ${REGISTRY}/$SERVICE:${BUILD_NUMBER} \
           --cache-to type=registry,ref=$REGISTRY/$SERVICE:buildcache,mode=max \
           --cache-from type=registry,ref=$REGISTRY/$SERVICE:buildcache \
           --push \
           .

          docker buildx rm "$BUILDER"
          
            '''
            }
          }
        }
      }
    }
  }
  stage('trivy scan'){
    parallel {
      stage('frontend-img-scan') {
        steps{
        withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
              sh '''
              SERVICE=frontend
              echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
             

             trivy image \
              --cache-dir /tmp/trivy-$SERVICE \
              --format json \
              --output ${SERVICE}-report.json \
              --severity CRITICAL \
              --exit-code 1 \
              ${REGISTRY}/${SERVICE}:${BUILD_NUMBER}
              '''
            }
        }
         post {
          always {
            archiveArtifacts artifacts: 'frontend-report.json', allowEmptyArchive: true
          }
        }
      }
      stage('backend-img-scan') {
        steps{
        withCredentials([usernamePassword(
             credentialsId: 'dockerhub-creds',
             usernameVariable: 'DOCKER_USER',
             passwordVariable: 'DOCKER_PASS'
            )]){
              sh '''
              SERVICE=backend
              echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

              trivy image \
              --cache-dir /tmp/trivy-$SERVICE \
              --format json \
              --output ${SERVICE}-report.json \
              --severity CRITICAL \
              --exit-code 1 \
              ${REGISTRY}/${SERVICE}:${BUILD_NUMBER}
              '''
            }
        }
        post {
          always {
            archiveArtifacts artifacts: 'backend-report.json', allowEmptyArchive: true
          }
        }
      }
    }
  }

      stage('generate sbom') {
        parallel {
          stage('frontend-sbom'){
            steps {
              sh '''
              SERVICE=frontend
              syft ${REGISTRY}/${SERVICE}:${BUILD_NUMBER} -o cyclonedx-json > $SERVICE-cyclonedx-sbom.json
              '''
            }
             post {
            always {
              archiveArtifacts artifacts: 'frontend-cyclonedx-sbom.json', allowEmptyArchive: true
            }
          }
          }
        stage('backend-sbom') {
           steps {
              sh '''
              SERVICE=backend              
              syft ${REGISTRY}/${SERVICE}:${BUILD_NUMBER} -o cyclonedx-json > $SERVICE-cyclonedx-sbom.json
              '''
            }
          post {
            always {
              archiveArtifacts artifacts: 'backend-cyclonedx-sbom.json' ,allowEmptyArchive: true
            }
          }
        }
        }
      }

      // stage('sbom upload') {
      //   parallel {
      //     stage('frontend-sbom-upload') {
      //     steps {
      //      dependencyTrackPublisher(
      //       artifact: 'frontend-cyclonedx-sbom.json',
      //       projectName: 'frontend',
      //       projectVersion: "${BUILD_NUMBER}",
      //       synchronous: true
      //   )
      //     }
      //     }
      //     stage('backend-sbom-upload') {
      //     steps {
      //      dependencyTrackPublisher(
      //       artifact: 'backend-cyclonedx-sbom.json',
      //       projectName: 'backend',
      //       projectVersion: "${BUILD_NUMBER}",
      //       synchronous: true
      //   )
      //     }
      //     }
      //   }
      // }
    

  
    }
  }
