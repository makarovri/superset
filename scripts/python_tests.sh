#!/usr/bin/env bash

#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
set -e

export SUPERSET_CONFIG=${SUPERSET_CONFIG:-tests.superset_test_config}
echo "Superset config module: $SUPERSET_CONFIG"

superset db upgrade
superset init
pytest --maxfail=1 --cov=superset tests/load_examples_test.py
pytest --maxfail=1 --cov=superset --cov-append --ignore=load_examples_test tests/*
