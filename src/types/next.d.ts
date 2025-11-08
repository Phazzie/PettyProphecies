import "next"

declare module "next" {
  export interface NextApiRequest {
    userId?: string
  }
}
