/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AuthMetadata,
  AuthenticationStrategy,
  ClusterDetails,
  KubernetesCredential,
} from '@backstage/plugin-kubernetes-node';
import type { User } from '@kubernetes/client-node';
import fs from 'fs-extra';

/**
 *
 * @public
 */
export class ServiceAccountStrategy implements AuthenticationStrategy {
  // Only used in tests
  private injectedKubernetesClient?: typeof import('@kubernetes/client-node');

  public async getCredential(
    clusterDetails: ClusterDetails,
  ): Promise<KubernetesCredential> {
    const { KubeConfig } =
      this.injectedKubernetesClient ??
      (await import('@kubernetes/client-node'));

    const token = clusterDetails.authMetadata.serviceAccountToken;
    if (token) {
      return { type: 'bearer token', token };
    }
    const kc = new KubeConfig();
    kc.loadFromCluster();
    // loadFromCluster is guaranteed to populate the user
    const user = kc.getCurrentUser() as User;

    return {
      type: 'bearer token',
      token: fs.readFileSync(user.authProvider.config.tokenFile).toString(),
    };
  }

  public validateCluster(): Error[] {
    return [];
  }

  public presentAuthMetadata(_authMetadata: AuthMetadata): AuthMetadata {
    return {};
  }
}
