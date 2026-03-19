import axios from 'axios';
import {
  GeneratePriceDataRequest, GeneratePriceDataResponse,
  ExecuteWorkflowRequest, ExecuteWorkflowResponse,
  BatchSimulateRequest, BatchSimulateResult,
} from './types';

const client = axios.create({
  baseURL: '/api/test',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // sends DSIP_SESSION cookie automatically
});

export async function apiGeneratePriceData(req: GeneratePriceDataRequest): Promise<GeneratePriceDataResponse> {
  const { data } = await client.post<GeneratePriceDataResponse>('/generate-price-data', req);
  return data;
}

export async function apiExecuteWorkflow(req: ExecuteWorkflowRequest): Promise<ExecuteWorkflowResponse> {
  const { data } = await client.post<ExecuteWorkflowResponse>('/execute-workflow', req);
  return data;
}

export async function apiBatchSimulate(req: BatchSimulateRequest): Promise<BatchSimulateResult> {
  const { data } = await client.post<BatchSimulateResult>('/batch-simulate', req);
  return data;
}
