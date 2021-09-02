import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

export default function Kitties (props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')

  const [kittiesCount, setKittiesCount] = useState(0)
  const [kittyDNAs, setKittyDNAs] = useState([])
  const [kittyOwners, setKittyOwners] = useState([])

  const fetchKittyCount = () => {
    let unsub = null

    const asyncFetch = async () => {
      unsub = await api.query.kittiesModule.kittiesCount((count) => {
        setKittiesCount(count)
      })
    }

    asyncFetch()

    return () => {
      unsub && unsub()
    }
  }

  const fetchKitties = () => {
    // TODO: 在这里调用 `api.query.kittiesModule.*` 函数去取得猫咪的信息。
    // 你需要取得：
    //   - 共有多少只猫咪
    //   - 每只猫咪的主人是谁
    //   - 每只猫咪的 DNA 是什么，用来组合出它的形态

    let unsubDNAs = null
    let unsubOwners = null

    const asyncFetch = async () => {
      const indices = Array.from({ length: kittiesCount }, (v, i) => i)

      unsubDNAs = await api.query.kittiesModule.kitties.multi(indices, (dnas) => {
        setKittyDNAs(dnas)
      })

      unsubOwners = await api.query.kittiesModule.owner.multi(indices, (owners) => {
        setKittyOwners(owners)
      })
    }

    asyncFetch()

    return () => {
      unsubDNAs && unsubDNAs()
      unsubOwners && unsubOwners()
    }
  }

  const populateKitties = () => {
    // TODO: 在这里添加额外的逻辑。你需要组成这样的数组结构：
    //  ```javascript
    //  const kitties = [{
    //    id: 0,
    //    dna: ...,
    //    owner: ...
    //  }, { id: ..., dna: ..., owner: ... }]
    //  ```
    // 这个 kitties 会传入 <KittyCards/> 然后对每只猫咪进行处理
    const kitties = []

    for (let i = 0, len = kittyOwners.length; i < len; ++i) {
      kitties[i] = {}
      kitties[i].id = i
      kitties[i].dna = kittyDNAs[i].unwrap()
      kitties[i].owner = kittyOwners[i].unwrap().toString()
    }

    setKitties(kitties)
  }

  useEffect(fetchKittyCount, [api, keyring])
  useEffect(fetchKitties, [api.query.kittiesModule.kitties, api.query.kittiesModule.owner, kittiesCount])
  useEffect(populateKitties, [kittyDNAs, kittyOwners])

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus}/>
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建小毛孩' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'kittiesModule',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
